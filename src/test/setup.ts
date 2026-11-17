import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// jsdom não tem IntersectionObserver; o showroom usa para medir as seções vistas.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(window, "IntersectionObserver", { value: NoopObserver, writable: true });
Element.prototype.scrollIntoView = () => {};
