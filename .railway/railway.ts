import { defineRailway, github, project, service } from "railway/iac";
// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "neo-app";
export default defineRailway(() => {
  const neoApp = service("neo-app", {
    source: github("andrelbraga/neo-app"),
    build: { buildEnvironment: "V3", builder: "DOCKERFILE", dockerfilePath: "Dockerfile" },
    healthcheck: "/",
    healthcheckTimeout: 30,
    replicas: { "iad": 1 },
  });

  return project("project", {
    variables: { managed: false },
    resources: [neoApp],
  });
});
