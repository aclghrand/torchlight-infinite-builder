import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { useRef } from "react";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "../globals.css";
import { DisclaimerModal } from "@/src/components/modals/DisclaimerModal";

function AnalyticsOnce(): React.ReactNode {
  const hasSentRef = useRef(false);

  return (
    <Analytics
      basePath="/monitor"
      beforeSend={(event) => {
        if (event.type === "pageview") {
          if (hasSentRef.current) return null;
          hasSentRef.current = true;
        }
        return event;
      }}
    />
  );
}

export const Route = createRootRoute({
  component: RootLayout,
  head: () => ({
    meta: [
      { title: "Torchlight of Building (Pre-Alpha)" },
      {
        name: "description",
        content: "Torchlight Infinite character build planner",
      },
    ],
  }),
});

function RootLayout(): React.ReactNode {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        <Outlet />
        <DisclaimerModal />
        <AnalyticsOnce />
        <Scripts />
      </body>
    </html>
  );
}
