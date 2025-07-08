interface LineItem {
	lineNumber: number;
	itemCode: string;
	itemDescription: string;
	quantity: string;
	unitOfMeasure: string;
	unitPrice: string;
	bonusAmount: string;
	date?: string;
}

function getDOMLineItemValues(): LineItem[] {
	const lineItems: LineItem[] = [];

	// Find all inputs with line item naming pattern
	const form = document.getElementById("line-items-form");
	if (!form) return lineItems;
	const itemCodeInputs = form.querySelectorAll('input[name^="itemCode_"]');

	itemCodeInputs.forEach((input) => {
		const nameAttr = input.getAttribute("name");
		if (!nameAttr) return;

		const lineNumber = Number.parseInt(nameAttr.split("_")[1]);
		if (Number.isNaN(lineNumber)) return;

		// Get values from DOM inputs for this line number
		const itemCode =
			(
				document.querySelector(
					`input[name="itemCode_${lineNumber}"]`,
				) as HTMLInputElement
			)?.value || "";
		const itemDescription =
			(
				document.querySelector(
					`textarea[name="itemDescription_${lineNumber}"]`,
				) as HTMLTextAreaElement
			)?.value || "";
		const quantity =
			(
				document.querySelector(
					`input[name="quantity_${lineNumber}"]`,
				) as HTMLInputElement
			)?.value || "1";
		const unitPrice =
			(
				document.querySelector(
					`input[name="unitPrice_${lineNumber}"]`,
				) as HTMLInputElement
			)?.value || "";
		const bonusAmount =
			(
				document.querySelector(
					`input[name="bonusAmount_${lineNumber}"]`,
				) as HTMLInputElement
			)?.value || "";

		lineItems.push({
			lineNumber,
			itemCode,
			itemDescription,
			quantity,
			unitOfMeasure: "7", // Default value from the component
			unitPrice,
			bonusAmount,
		});
	});

	return lineItems.sort((a, b) => a.lineNumber - b.lineNumber);
}

function mergeLineItems(webItems: LineItem[]): LineItem[] {
	const mergedMap = new Map<number, LineItem>();

	// Get actual DOM values instead of using stale form state
	const domItems = getDOMLineItemValues();

	// Create a set of web item line numbers for deletion detection
	const webLineNumbers = new Set(webItems.map((item) => item.lineNumber));

	// Only keep DOM items that still exist in the web (handle deletions)
	const validDomItems = domItems.filter((item) =>
		webLineNumbers.has(item.lineNumber),
	);

	// First, add valid DOM items to the map (these are the current user inputs)
	validDomItems.forEach((item) => {
		mergedMap.set(item.lineNumber, { ...item });
	});

	// Then, merge with web items
	webItems.forEach((webItem) => {
		const existingItem = mergedMap.get(webItem.lineNumber);

		if (existingItem) {
			// If line number exists, prioritize DOM data (user input) over web data
			// But use web data for empty fields
			const mergedItem: LineItem = {
				...webItem, // Start with web data as base
				// Override with DOM data only if the DOM field has a value
				itemCode: existingItem.itemCode || webItem.itemCode,
				itemDescription:
					existingItem.itemDescription || webItem.itemDescription,
				quantity: existingItem.quantity || webItem.quantity,
				unitOfMeasure: existingItem.unitOfMeasure || webItem.unitOfMeasure,
				unitPrice: existingItem.unitPrice || webItem.unitPrice,
				bonusAmount: existingItem.bonusAmount || webItem.bonusAmount,
				// For date, prioritize DOM date if it exists, otherwise use web date
				...(existingItem.date
					? { date: existingItem.date }
					: webItem.date
						? { date: webItem.date }
						: {}),
			};

			mergedMap.set(webItem.lineNumber, mergedItem);
		} else {
			// If line number doesn't exist in DOM, add the web item (new item)
			mergedMap.set(webItem.lineNumber, { ...webItem });
		}
	});

	return Array.from(mergedMap.values()).sort(
		(a, b) => a.lineNumber - b.lineNumber,
	);
}

export { mergeLineItems, type LineItem };
