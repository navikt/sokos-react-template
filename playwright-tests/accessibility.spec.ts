import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Axe a11y", () => {
	test("should not have any automatically detectable accessibility issues", async ({
		page,
	}) => {
		await page.goto("/mikrofrontend");

		await expect(
			page.getByRole("heading", {
				name: "React grensesnittmal for Utbetalingsportalen",
			}),
		).toBeVisible();

		const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});
});
