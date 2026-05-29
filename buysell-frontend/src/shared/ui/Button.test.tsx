import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button";

describe("Button", () => {
  it("renders children and handles click", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={onClick}>Сохранить</Button>);

    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
