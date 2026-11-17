import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordInput } from "./PasswordInput";

it("o olho mostra e esconde o que foi digitado", async () => {
  const user = userEvent.setup();
  render(
    <label>
      Senha
      <PasswordInput defaultValue="segredo-123" />
    </label>,
  );
  const input = screen.getByLabelText("Senha");
  expect(input).toHaveAttribute("type", "password");
  await user.click(screen.getByRole("button", { name: "Mostrar senha" }));
  expect(input).toHaveAttribute("type", "text");
  await user.click(screen.getByRole("button", { name: "Ocultar senha" }));
  expect(input).toHaveAttribute("type", "password");
});
