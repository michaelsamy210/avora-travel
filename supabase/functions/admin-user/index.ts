import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const authHeader =
      req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: "Missing authorization.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const supabaseAnonKey =
      Deno.env.get("SUPABASE_ANON_KEY");

    const serviceRoleKey =
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
      );

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !serviceRoleKey
    ) {
      throw new Error(
        "Supabase environment variables are missing."
      );
    }

    const supabaseUser =
      createClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          global: {
            headers: {
              Authorization: authHeader,
            },
          },
        }
      );

    const {
      data: {
        user,
      },
      error: userError,
    } =
      await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        serviceRoleKey
      );

    const {
      data: currentAdmin,
      error: currentAdminError,
    } =
      await supabaseAdmin
        .from("admin_users")
        .select("role, active")
        .eq("id", user.id)
        .single();

    if (
      currentAdminError ||
      !currentAdmin ||
      currentAdmin.role !== "admin" ||
      !currentAdmin.active
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Only active administrators can manage users.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const body = await req.json();

    const action = body?.action;

    /*
     * ============================================
     * CREATE USER
     * ============================================
     */

    if (action === "create") {
      const email =
        String(body.email || "")
          .trim()
          .toLowerCase();

      const password =
        String(body.password || "");

      const displayName =
        String(
          body.display_name || ""
        ).trim();

      const role =
        body.role === "admin"
          ? "admin"
          : "manager";

      if (!email) {
        return new Response(
          JSON.stringify({
            error:
              "Email is required.",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type":
                "application/json",
            },
          }
        );
      }

      if (password.length < 8) {
        return new Response(
          JSON.stringify({
            error:
              "Password must be at least 8 characters.",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type":
                "application/json",
            },
          }
        );
      }

      const {
        data: existingUser,
      } =
        await supabaseAdmin
          .from("admin_users")
          .select("id")
          .eq("email", email)
          .maybeSingle();

      if (existingUser) {
        return new Response(
          JSON.stringify({
            error:
              "A dashboard user with this email already exists.",
          }),
          {
            status: 409,
            headers: {
              ...corsHeaders,
              "Content-Type":
                "application/json",
            },
          }
        );
      }

      const {
        data: createdAuth,
        error: createAuthError,
      } =
        await supabaseAdmin.auth.admin.createUser(
          {
            email,
            password,
            email_confirm: true,
          }
        );

      if (
        createAuthError ||
        !createdAuth.user
      ) {
        return new Response(
          JSON.stringify({
            error:
              createAuthError?.message ||
              "Unable to create auth user.",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type":
                "application/json",
            },
          }
        );
      }

      const {
        error: profileError,
      } =
        await supabaseAdmin
          .from("admin_users")
          .insert({
            id: createdAuth.user.id,
            email,
            display_name:
              displayName ||
              email.split("@")[0],
            role,
            active: true,
          });

      if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(
          createdAuth.user.id
        );

        return new Response(
          JSON.stringify({
            error:
              profileError.message ||
              "Unable to create admin profile.",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type":
                "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message:
            "Dashboard user created successfully.",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    /*
     * ============================================
     * DELETE USER
     * ============================================
     */

    if (action === "delete") {
      const userId = body.user_id;

      if (!userId) {
        return new Response(
          JSON.stringify({
            error:
              "User ID is required.",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type":
                "application/json",
            },
          }
        );
      }

      if (userId === user.id) {
        return new Response(
          JSON.stringify({
            error:
              "You cannot delete your own account.",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type":
                "application/json",
            },
          }
        );
      }

      const {
        data: targetUser,
        error: targetError,
      } =
        await supabaseAdmin
          .from("admin_users")
          .select("id")
          .eq("id", userId)
          .single();

      if (
        targetError ||
        !targetUser
      ) {
        return new Response(
          JSON.stringify({
            error:
              "Dashboard user not found.",
          }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              "Content-Type":
                "application/json",
            },
          }
        );
      }

      const {
        error: deleteError,
      } =
        await supabaseAdmin.auth.admin.deleteUser(
          userId
        );

      if (deleteError) {
        return new Response(
          JSON.stringify({
            error:
              deleteError.message ||
              "Unable to delete user.",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type":
                "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message:
            "Dashboard user deleted successfully.",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Unknown action.",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      }
    );
  } catch (error) {
    console.error(
      "Admin user function error:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      }
    );
  }
});