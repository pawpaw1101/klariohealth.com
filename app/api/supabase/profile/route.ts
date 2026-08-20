import { withSupabase } from "@supabase/server"

export const runtime = "nodejs"

export const GET = withSupabase({ auth: "user" }, async (_request, ctx) => {
  const { data, error } = await ctx.supabase.auth.getUser()

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 401 },
    )
  }

  return Response.json({
    authMode: ctx.authMode,
    user: {
      id: ctx.userClaims?.id ?? data.user?.id ?? null,
      email: ctx.userClaims?.email ?? data.user?.email ?? null,
      role: ctx.userClaims?.role ?? null,
    },
  })
})
