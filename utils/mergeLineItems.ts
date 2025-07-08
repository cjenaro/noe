interface LineItem {
  lineNumber: number;
  itemCode: string;
  itemDescription: string;
  quantity: string;
  unitOfMeasure: string;
  unitPrice: string;
  bonusAmount: string;
}

function getInputValue(name: string, defaultValue = ""): string {
  return (
    (document.querySelector(`input[name="${name}"]`) as HTMLInputElement)
      ?.value || defaultValue
  );
}

function getTextareaValue(name: string, defaultValue = ""): string {
  return (
    (document.querySelector(`textarea[name="${name}"]`) as HTMLTextAreaElement)
      ?.value || defaultValue
  );
}

function getDOMLineItemValues(): LineItem[] {
  const lineItems: LineItem[] = [];
  const itemCodeInputs = document.querySelectorAll('input[name^="itemCode_"]');

  itemCodeInputs.forEach((input) => {
    const nameAttr = input.getAttribute("name");
    if (!nameAttr) return;

    const lineNumber = Number.parseInt(nameAttr.split("_")[1]);
    if (Number.isNaN(lineNumber)) return;

    lineItems.push({
      lineNumber,
      itemCode: getInputValue(`itemCode_${lineNumber}`),
      itemDescription: getTextareaValue(`itemDescription_${lineNumber}`),
      quantity: getInputValue(`quantity_${lineNumber}`, "1"),
      unitOfMeasure: "7", // Default value from the component
      unitPrice: getInputValue(`unitPrice_${lineNumber}`),
      bonusAmount: getInputValue(`bonusAmount_${lineNumber}`),
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
      const mergedItem: LineItem = {
        ...webItem, // Start with web data as base
        itemCode: existingItem.itemCode || webItem.itemCode,
        itemDescription:
          existingItem.itemDescription || webItem.itemDescription,
        quantity: existingItem.quantity || webItem.quantity,
        unitOfMeasure: existingItem.unitOfMeasure || webItem.unitOfMeasure,
        unitPrice: existingItem.unitPrice || webItem.unitPrice,
        bonusAmount: existingItem.bonusAmount || webItem.bonusAmount,
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
