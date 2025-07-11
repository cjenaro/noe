// Utility to fetch select options from AFIP DOM
export interface SelectOption {
  value: string;
  label: string;
}

export async function fetchSelectOptions(fieldId: string): Promise<SelectOption[]> {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) {
      throw new Error('No active tab found');
    }

    const response = await browser.tabs.sendMessage(tab.id, {
      action: 'getSelectOptions',
      fieldId
    });

    if (response?.success && response?.options) {
      return response.options;
    } else {
      console.warn(`Failed to fetch options for ${fieldId}:`, response?.error);
      return [];
    }
  } catch (error) {
    console.error(`Error fetching options for ${fieldId}:`, error);
    return [];
  }
}

// Field mapping for autocompletes
export const FIELD_MAPPINGS = {
  puntoVenta: 'puntodeventa',
  tipoComprobante: 'universocomprobante', 
  idioma: 'ididioma',
  concepto: 'idconcepto',
  actividad: 'actiAsociadaId',
  moneda: 'moneda',
  country: 'destino'
} as const;

export type FieldKey = keyof typeof FIELD_MAPPINGS;

// Fetch options for a specific field
export async function fetchFieldOptions(fieldKey: FieldKey): Promise<SelectOption[]> {
  const domFieldId = FIELD_MAPPINGS[fieldKey];
  return await fetchSelectOptions(domFieldId);
}

// Fetch multiple field options at once
export async function fetchMultipleFieldOptions(fieldKeys: FieldKey[]): Promise<Record<FieldKey, SelectOption[]>> {
  const results: Record<FieldKey, SelectOption[]> = {} as any;
  
  await Promise.all(
    fieldKeys.map(async (fieldKey) => {
      results[fieldKey] = await fetchFieldOptions(fieldKey);
    })
  );
  
  return results;
}

// Update a DOM field immediately
export async function updateDOMField(fieldKey: FieldKey, value: string): Promise<void> {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) {
      throw new Error('No active tab found');
    }

    const domFieldId = FIELD_MAPPINGS[fieldKey];
    await browser.tabs.sendMessage(tab.id, {
      action: 'updateDOMField',
      fieldId: domFieldId,
      value
    });
  } catch (error) {
    console.error(`Error updating DOM field ${fieldKey}:`, error);
  }
}

// Fill the final step with item details
export async function fillFinalStep(data: {
  itemCode?: string;
  itemDescription?: string;
  quantity?: string;
  unitOfMeasure?: string;
  unitPrice?: string;
  bonusAmount?: string;
  otherData?: string;
}): Promise<void> {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) {
      throw new Error('No active tab found');
    }

    await browser.tabs.sendMessage(tab.id, {
      action: 'fillFinalStep',
      data
    });
  } catch (error) {
    console.error('Error filling final step:', error);
    throw error;
  }
}