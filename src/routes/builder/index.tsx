import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/builder/")({
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/builder/equipment", search });
  },
  component: () => null,
});
