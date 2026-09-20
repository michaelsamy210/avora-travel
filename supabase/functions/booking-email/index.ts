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
    const authHeader = req.headers.get("Authorization");

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

    const supabaseServiceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !supabaseServiceRoleKey
    ) {
      throw new Error(
        "Supabase environment variables are missing."
      );
    }

    /*
     * Client authenticated as the current user.
     */
    const supabaseUser = createClient(
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
    } = await supabaseUser.auth.getUser();

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

    /*
     * Service-role client.
     * This stays inside the Edge Function.
     */
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey
    );

    /*
     * Check Admin / Manager role.
     */
    const {
      data: adminUser,
      error: adminError,
    } = await supabaseAdmin
      .from("admin_users")
      .select("role, active")
      .eq("id", user.id)
      .single();

    if (
      adminError ||
      !adminUser ||
      !adminUser.active ||
      !["admin", "manager"].includes(
        adminUser.role
      )
    ) {
      return new Response(
        JSON.stringify({
          error: "You are not authorized to send booking emails.",
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

    const {
      bookingId,
      status,
    } = await req.json();

    if (!bookingId) {
      return new Response(
        JSON.stringify({
          error: "bookingId is required.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (
      status !== "confirmed" &&
      status !== "cancelled"
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Status must be confirmed or cancelled.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    /*
     * Get the actual booking from the database.
     */
    const {
      data: booking,
      error: bookingError,
    } = await supabaseAdmin
      .from("bookings")
      .select(`
        id,
        customer_name,
        email,
        phone,
        seats,
        travel_date,
        notes,
        trip_id,
        trips (
          name,
          destination
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error(
        "Booking lookup error:",
        bookingError
      );

      return new Response(
        JSON.stringify({
          error: "Booking not found.",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!booking.email) {
      return new Response(
        JSON.stringify({
          error:
            "This booking does not have a customer email address.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const resendApiKey =
      Deno.env.get("RESEND_API_KEY");

    const fromEmail =
      Deno.env.get("BOOKING_FROM_EMAIL");

    if (!resendApiKey || !fromEmail) {
      return new Response(
        JSON.stringify({
          error:
            "Email service is not configured.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const isConfirmed =
      status === "confirmed";

    const subject = isConfirmed
      ? "Your AVORA booking is confirmed"
      : "Update regarding your AVORA booking";

    const heading = isConfirmed
      ? "Booking Confirmed"
      : "Booking Cancelled";

    const message = isConfirmed
      ? "Your travel booking has been confirmed successfully."
      : "Unfortunately, your travel booking has been cancelled.";

    const trip =
      Array.isArray(booking.trips)
        ? booking.trips[0]
        : booking.trips;

    const tripName =
      trip?.name ||
      "AVORA Trip";

    const destination =
      trip?.destination ||
      "";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${heading}</title>
        </head>

        <body style="
          margin:0;
          padding:0;
          background:#f4f4f4;
          font-family:Arial,Helvetica,sans-serif;
        ">

          <div style="
            max-width:600px;
            margin:40px auto;
            background:#ffffff;
            border-radius:16px;
            overflow:hidden;
            box-shadow:0 10px 40px rgba(0,0,0,0.08);
          ">

            <div style="
              padding:32px;
              background:#111111;
              color:#ffffff;
              text-align:center;
            ">

              <h1 style="
                margin:0;
                font-size:30px;
                letter-spacing:4px;
              ">
                AVORA
              </h1>

              <p style="
                margin:8px 0 0;
                color:#aaaaaa;
                font-size:13px;
                letter-spacing:1px;
              ">
                TRAVEL
              </p>

            </div>

            <div style="
              padding:36px;
            ">

              <h2 style="
                margin:0 0 20px;
                color:#111111;
                font-size:24px;
              ">
                ${heading}
              </h2>

              <p style="
                margin:0 0 16px;
                color:#444444;
                line-height:1.7;
                font-size:15px;
              ">
                Hello ${
                  booking.customer_name ||
                  "there"
                },
              </p>

              <p style="
                margin:0 0 25px;
                color:#555555;
                line-height:1.7;
                font-size:15px;
              ">
                ${message}
              </p>

              <div style="
                margin:25px 0;
                padding:20px;
                background:#f7f7f7;
                border-radius:12px;
              ">

                <p style="
                  margin:0 0 12px;
                  color:#333333;
                ">
                  <strong>Trip:</strong>
                  ${tripName}
                </p>

                ${
                  destination
                    ? `
                      <p style="
                        margin:0 0 12px;
                        color:#333333;
                      ">
                        <strong>Destination:</strong>
                        ${destination}
                      </p>
                    `
                    : ""
                }

                <p style="
                  margin:0 0 12px;
                  color:#333333;
                ">
                  <strong>Travel Date:</strong>
                  ${
                    booking.travel_date ||
                    "Not specified"
                  }
                </p>

                <p style="
                  margin:0;
                  color:#333333;
                ">
                  <strong>Seats:</strong>
                  ${
                    booking.seats ||
                    "Not specified"
                  }
                </p>

              </div>

              <p style="
                margin:25px 0 0;
                color:#777777;
                line-height:1.7;
                font-size:14px;
              ">
                Thank you for choosing AVORA Travel.
              </p>

            </div>

            <div style="
              padding:20px;
              background:#f7f7f7;
              text-align:center;
              color:#999999;
              font-size:12px;
            ">
              AVORA Travel
            </div>

          </div>

        </body>
      </html>
    `;

    const resendResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [booking.email],
          subject,
          html,
        }),
      }
    );

    const resendResult =
      await resendResponse.json();

    if (!resendResponse.ok) {
      console.error(
        "Resend error:",
        resendResult
      );

      return new Response(
        JSON.stringify({
          error:
            resendResult?.message ||
            "Failed to send customer email.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Booking email sent successfully.",
        emailId:
          resendResult?.id || null,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(
      "Booking email function error:",
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
          "Content-Type": "application/json",
        },
      }
    );
  }
});