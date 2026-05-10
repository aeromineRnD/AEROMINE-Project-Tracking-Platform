import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (!token) return NextResponse.redirect(new URL("/login", req.url));

    const role = token.role as string;

    // Clients cannot access admin routes
    if (pathname.startsWith("/admin") && role === "CLIENT") {
      return NextResponse.redirect(new URL("/client/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true, // let the middleware function handle auth logic
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/client/:path*",
    "/",
  ],
};
