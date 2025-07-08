export default defineContentScript({
  matches: ["*://fe.afip.gob.ar/*"],
  main() {
    console.log(
      "AFIP Invoice Helper content script loaded on:",
      window.location.href,
    );

    // Always initialize the helper to listen for messages
    initializeAfipHelper();

    // Always show floating button on AFIP pages
    console.log("AFIP page detected, adding floating button");
    createFloatingButton();

    // Initialize navigation sync
    initializeNavigationSync();
  },
});

// URL to step mapping
const URL_STEP_MAPPING = {
  "buscarPtosVtas.do": 1,
  "genComDatosEmisor.do": 2,
  "genComDatosReceptor.do": 3,
  "genComDatosOperacion.do": 4,
} as const;

function getCurrentStepFromURL(): number {
  const url = window.location.href;
  console.log("Checking step for URL:", url);

  for (const [urlPattern, step] of Object.entries(URL_STEP_MAPPING)) {
    if (url.includes(urlPattern)) {
      console.log(`Found step ${step} for URL pattern: ${urlPattern}`);
      return step;
    }
  }

  console.log("No step mapping found for URL, defaulting to step 1");
  return 1;
}

function initializeNavigationSync() {
  console.log("Initializing navigation sync...");

  syncStepWithSidepanel();

  window.addEventListener("popstate", () => {
    console.log("Popstate event detected");
    setTimeout(syncStepWithSidepanel, 100);
  });

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(history, args);
    console.log("PushState detected");
    setTimeout(syncStepWithSidepanel, 100);
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(history, args);
    console.log("ReplaceState detected");
    setTimeout(syncStepWithSidepanel, 100);
  };
}

function syncStepWithSidepanel() {
  const currentStep = getCurrentStepFromURL();
  console.log(`Syncing step ${currentStep} with sidepanel`);

  // Send message to background script to forward to sidepanel
  browser.runtime
    .sendMessage({
      action: "syncStep",
      step: currentStep,
      url: window.location.href,
    })
    .catch((error) => {
      console.log("Could not sync step (sidepanel might not be open):", error);
    });
}

function initializeAfipHelper() {
  console.log("AFIP helper initializing message listeners...");

  // Initialize line item tracking for step 4
  initializeLineItemTracking();

  // Listen for messages from popup
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log("Content script received message:", message);

    try {
      if (message.action === "fillStep3AndContinue") {
        fillStep3AndContinue(message.data);
        sendResponse({ success: true });
      } else if (message.action === "fillStep1AndContinue") {
        fillStep1AndContinue(message.data);
        sendResponse({ success: true });
      } else if (message.action === "fillStep2AndContinue") {
        fillStep2AndContinue(message.data);
        sendResponse({ success: true });
      } else if (message.action === "extractForm") {
        const formData = extractFormData();
        sendResponse({ data: formData });
      } else if (message.action === "getSelectOptions") {
        const options = getSelectOptions(message.fieldId);
        sendResponse({ success: true, options });
      } else if (message.action === "updateDOMField") {
        updateDOMField(message.fieldId, message.value);
        sendResponse({ success: true });
      } else if (message.action === "fillFinalStep") {
        fillFinalStep(message.data)
          .then(() => {
            sendResponse({ success: true });
          })
          .catch((error) => {
            console.error("Error in fillFinalStep:", error);
            sendResponse({ success: false, error: error.message });
          });
      } else {
        console.log("Unknown action:", message.action);
        sendResponse({ success: false, error: "Unknown action" });
      }
    } catch (error) {
      console.error("Error handling message:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      sendResponse({ success: false, error: errorMessage });
    }

    // Return true to indicate we will send a response asynchronously
    return true;
  });
}

function createFloatingButton() {
  const button = document.createElement("div");
  button.id = "afip-helper-btn";
  button.innerHTML = "🇦🇷";
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    background: #0066cc;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10000;
    font-size: 20px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
  `;

  button.addEventListener("click", async () => {
    try {
      // Send message to background script to open sidebar/sidepanel
      await browser.runtime.sendMessage({
        command: "openSidebar",
      });
    } catch (error) {
      console.error("Error requesting sidebar:", error);
      showNotification("Error al abrir panel lateral", "error");
    }
  });

  button.addEventListener("mouseenter", () => {
    button.style.transform = "scale(1.1)";
  });

  button.addEventListener("mouseleave", () => {
    button.style.transform = "scale(1)";
  });

  document.body.appendChild(button);
}

function fillStep1AndContinue(data: any) {
  console.log("fillStep1AndContinue called with data:", data);
  console.log("Current page URL:", window.location.href);

  // Fill first step fields only
  const firstStepFields = {
    puntodeventa: data.puntoVenta,
    universocomprobante: data.tipoComprobante,
  };

  let filledCount = 0;
  let errors: string[] = [];

  // Fill first step fields
  Object.entries(firstStepFields).forEach(([fieldId, value]) => {
    console.log(`Trying to fill field ${fieldId} with value:`, value);
    if (value) {
      const element = document.getElementById(fieldId) as HTMLSelectElement;
      if (element) {
        console.log(`Found element ${fieldId}, setting value...`);
        element.value = value;
        // Trigger change event to ensure form validation and dependent field updates
        element.dispatchEvent(new Event("change", { bubbles: true }));
        element.dispatchEvent(new Event("input", { bubbles: true }));
        filledCount++;
        console.log(`Successfully filled ${fieldId}`);
      } else {
        const error = `Element with ID '${fieldId}' not found`;
        console.error(error);
        errors.push(error);
      }
    } else {
      const error = `No value provided for ${fieldId}`;
      console.warn(error);
      errors.push(error);
    }
  });

  console.log(`Filled ${filledCount} fields, ${errors.length} errors:`, errors);

  // Wait a moment for any async validation, then click continue button
  setTimeout(() => {
    console.log("Looking for continue button...");
    console.log(
      "All buttons on page:",
      Array.from(document.querySelectorAll('input[type="button"], button')).map(
        (btn) => ({
          tagName: btn.tagName,
          type: btn.getAttribute("type"),
          value: btn.getAttribute("value"),
          onclick: btn.getAttribute("onclick"),
          textContent: btn.textContent,
        }),
      ),
    );

    // Try multiple selectors for the continue button
    const buttonSelectors = [
      'input[type="button"][onclick="validarCampos();"]',
      'input[type="button"][onclick*="validarCampos"]',
      'input[type="button"][value*="Continuar"]',
      'input[onclick="validarCampos();"]',
      'input[onclick*="validarCampos"]',
      'input[value="Continuar >"]',
      'input[value*="Continuar"]',
      'button[onclick*="validarCampos"]',
    ];

    let continueButton = null;
    for (const selector of buttonSelectors) {
      continueButton = document.querySelector(selector) as HTMLInputElement;
      if (continueButton) {
        console.log(`Found continue button with selector: ${selector}`);
        break;
      }
    }

    if (continueButton) {
      console.log("Clicking continue button...");
      continueButton.click();
      showNotification(
        `Paso 1 completado (${filledCount} campos), continuando...`,
        "success",
      );
    } else {
      console.error("Continue button not found.");
      showNotification(
        `Campos completados (${filledCount}), pero no se encontró el botón continuar`,
        "error",
      );
    }
  }, 1000); // Increased timeout to 1 second
}

function fillStep2AndContinue(data: any) {
  console.log("fillStep2AndContinue called with data:", data);

  // Step 2 fields mapping
  const step2Fields = {
    ididioma: data.idioma,
    fc: data.fechaComprobante, // fecha comprobante
    idconcepto: data.concepto,
    actiAsociadaId: data.actividad,
    monedaextranjera: data.monedaExtranjera ? "on" : "", // checkbox
    moneda: data.moneda,
  };

  let filledCount = 0;
  let errors: string[] = [];

  // Fill step 2 fields
  Object.entries(step2Fields).forEach(([fieldId, value]) => {
    console.log(`Trying to fill field ${fieldId} with value:`, value);
    if (value !== undefined && value !== "") {
      const element = document.getElementById(fieldId) as
        | HTMLInputElement
        | HTMLSelectElement;
      if (element) {
        console.log(`Found element ${fieldId}, setting value...`);

        if (element.type === "checkbox") {
          (element as HTMLInputElement).checked = value === "on";
          // Trigger click event for checkboxes to ensure proper handling
          element.click();
        } else {
          element.value = value;
        }

        // Trigger change event to ensure form validation and dependent field updates
        element.dispatchEvent(new Event("change", { bubbles: true }));
        filledCount++;
        console.log(`Successfully filled ${fieldId}`);
      } else {
        const error = `Element with ID '${fieldId}' not found`;
        console.error(error);
        errors.push(error);
      }
    }
  });

  console.log(`Filled ${filledCount} fields, ${errors.length} errors:`, errors);

  // Wait a moment for any async validation, then click continue button
  setTimeout(() => {
    console.log("Looking for continue button...");
    console.log("Current page URL:", window.location.href);
    console.log(
      "All buttons on page:",
      Array.from(document.querySelectorAll('input[type="button"], button')).map(
        (btn) => ({
          tagName: btn.tagName,
          type: btn.getAttribute("type"),
          value: btn.getAttribute("value"),
          onclick: btn.getAttribute("onclick"),
          textContent: btn.textContent,
        }),
      ),
    );

    // Try multiple selectors for the continue button
    const buttonSelectors = [
      'input[type="button"][onclick="validarCampos();"]',
      'input[type="button"][onclick*="validarCampos"]',
      'input[type="button"][value*="Continuar"]',
      'input[onclick="validarCampos();"]',
      'input[onclick*="validarCampos"]',
      'input[value="Continuar >"]',
      'input[value*="Continuar"]',
      'button[onclick*="validarCampos"]',
    ];

    let continueButton = null;
    for (const selector of buttonSelectors) {
      continueButton = document.querySelector(selector) as HTMLInputElement;
      if (continueButton) {
        console.log(`Found continue button with selector: ${selector}`);
        break;
      }
    }

    if (continueButton) {
      console.log("Clicking continue button...");
      continueButton.click();
      showNotification(
        `Paso 2 completado (${filledCount} campos), continuando...`,
        "success",
      );
    } else {
      console.error("Continue button not found.");
      showNotification(
        `Campos completados (${filledCount}), pero no se encontró el botón continuar`,
        "error",
      );
    }
  }, 1000); // Increased timeout to 1 second
}

function fillStep3AndContinue(data: any) {
  // First step fields (punto de venta and tipo de comprobante)
  const firstStepFields = {
    puntodeventa: data.puntoVenta,
    universocomprobante: data.tipoComprobante,
  };

  // Second step fields (client data)
  const secondStepFields = {
    destino: data.country,
    nrodocreceptor: data.cuit,
    nrodocextranjeroreceptor: data.cuit, // Fill both CUIT fields with same value
    razonsocialreceptor: data.companyName,
    domicilioreceptor: data.address,
    email: data.email,
    descripcionformadepago: data.paymentMethod,
    incoterm: data.incoterm,
    detalleincoterm: data.incotermDetail,
    otrosdatoscomerciales: data.otherData,
  };

  // Fill first step fields
  Object.entries(firstStepFields).forEach(([fieldId, value]) => {
    if (value) {
      const element = document.getElementById(fieldId) as HTMLSelectElement;
      if (element) {
        element.value = value;
        // Trigger change event to ensure form validation and dependent field updates
        element.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  });

  // Fill second step fields
  Object.entries(secondStepFields).forEach(([fieldId, value]) => {
    if (value) {
      const element = document.getElementById(fieldId) as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement;
      if (element) {
        element.value = value;
        // Trigger change event to ensure form validation
        element.dispatchEvent(new Event("change", { bubbles: true }));
        console.log(`Successfully filled ${fieldId} with value: ${value}`);
      } else {
        console.warn(
          `Field ${fieldId} not found on current page. Available form fields:`,
          Array.from(document.querySelectorAll("input, select, textarea"))
            .map((el) => el.id)
            .filter((id) => id),
        );
      }
    }
  });

  // Show success notification
  const filledFields = Object.values({
    ...firstStepFields,
    ...secondStepFields,
  }).filter(Boolean).length;

  // Wait a moment for any async validation, then click continue button
  setTimeout(() => {
    console.log("Looking for continue button...");
    console.log("Current page URL:", window.location.href);
    console.log(
      "All buttons on page:",
      Array.from(document.querySelectorAll('input[type="button"], button')).map(
        (btn) => ({
          tagName: btn.tagName,
          type: btn.getAttribute("type"),
          value: btn.getAttribute("value"),
          onclick: btn.getAttribute("onclick"),
          textContent: btn.textContent,
        }),
      ),
    );

    // Try multiple selectors for the continue button
    const buttonSelectors = [
      'input[type="button"][onclick="validarCampos();"]',
      'input[type="button"][onclick*="validarCampos"]',
      'input[type="button"][value*="Continuar"]',
      'input[onclick="validarCampos();"]',
      'input[onclick*="validarCampos"]',
      'input[value="Continuar >"]',
      'input[value*="Continuar"]',
      'button[onclick*="validarCampos"]',
    ];

    let continueButton = null;
    for (const selector of buttonSelectors) {
      continueButton = document.querySelector(selector) as HTMLInputElement;
      if (continueButton) {
        console.log(`Found continue button with selector: ${selector}`);
        break;
      }
    }

    if (continueButton) {
      console.log("Clicking continue button...");
      continueButton.click();
      showNotification(
        `Paso 3 completado (${filledFields} campos), continuando...`,
        "success",
      );
    } else {
      console.error("Continue button not found.");
      showNotification(
        `Campos completados (${filledFields}), pero no se encontró el botón continuar`,
        "error",
      );
    }
  }, 1000);
}

function extractFormData() {
  const getValue = (id: string) => {
    const element = document.getElementById(id) as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement;
    return element?.value || "";
  };

  return {
    country: getValue("destino"),
    cuit: getValue("nrodocreceptor"), // Use CUIT as primary value
    companyName: getValue("razonsocialreceptor"),
    address: getValue("domicilioreceptor"),
    email: getValue("email"),
    paymentMethod: getValue("descripcionformadepago"),
    incoterm: getValue("incoterm"),
    incotermDetail: getValue("detalleincoterm"),
    otherData: getValue("otrosdatoscomerciales"),
  };
}

function getSelectOptions(
  fieldId: string,
): Array<{ value: string; label: string }> {
  console.log(`Getting options for field: ${fieldId}`);

  const selectElement = document.getElementById(fieldId) as HTMLSelectElement;
  if (!selectElement) {
    console.warn(`Select element with ID '${fieldId}' not found`);
    return [];
  }

  const options: Array<{ value: string; label: string }> = [];

  // Get all option elements
  const optionElements = selectElement.querySelectorAll("option");

  optionElements.forEach((option) => {
    const value = option.value;
    const label = option.textContent?.trim() || option.innerText?.trim() || "";

    // Skip empty options or placeholder options
    if (value && value !== "" && label && label !== "Seleccionar...") {
      options.push({ value, label });
    }
  });

  console.log(`Found ${options.length} options for ${fieldId}:`, options);
  return options;
}

async function fillFinalStep(data: any) {
  console.log("fillFinalStep called with data:", data);

  let filledCount = 0;
  let errors: string[] = [];

  // Handle line items array
  const lineItems: any[] = data.lineItems || [];
  console.log(`Processing ${lineItems.length} line items`);

  // First, ensure we have enough lines in the DOM by clicking "Agregar línea descripción"
  // Count existing lines in DOM using table rows
  const table = document.getElementById("idoperacion") as HTMLTableElement;
  if (!table) {
    console.warn("Could not find table with id 'idoperacion'");
    return;
  }

  const existingRows = getLineItemRows(table);
  const existingLines = existingRows.length;

  console.log(
    `Found ${existingLines} existing lines, need ${lineItems.length} lines`,
  );

  // Add more lines if needed
  for (let i = existingLines; i < lineItems.length; i++) {
    console.log(`Adding line item ${i + 1}`);

    // Find and click the "Agregar línea descripción" button
    const addLineButton = document.querySelector(
      'input[type="button"][value="Agregar línea descripción"]',
    ) as HTMLInputElement;
    if (addLineButton) {
      console.log("Clicking 'Agregar línea descripción' button");
      addLineButton.click();

      // Wait a bit for the new row to be added
      await new Promise((resolve) => setTimeout(resolve, 500));
    } else {
      console.warn("Could not find 'Agregar línea descripción' button");
      break;
    }
  }

  // Now fill each line item that exists in our data
  lineItems.forEach((item: any) => {
    const lineNumber = item.lineNumber || 1;
    console.log(`Filling line item ${lineNumber}:`, item);

    const lineFields = {
      [`detalle_codigo_articulo${lineNumber}`]: item.itemCode || "",
      [`detalle_descripcion${lineNumber}`]: item.itemDescription || "",
      [`detalle_cantidad${lineNumber}`]: item.quantity || "1",
      [`detalle_medida${lineNumber}`]: item.unitOfMeasure || "7",
      [`detalle_precio${lineNumber}`]: item.unitPrice || "",
      [`detalle_importe_bonificacion${lineNumber}`]: item.bonusAmount || "",
    };

    Object.entries(lineFields).forEach(([fieldId, value]) => {
      console.log(`Trying to fill field ${fieldId} with value:`, value);
      if (value !== undefined && value !== "") {
        const element = document.getElementById(fieldId) as
          | HTMLInputElement
          | HTMLSelectElement
          | HTMLTextAreaElement;
        if (element) {
          console.log(`Found element ${fieldId}, setting value...`);
          element.value = value;

          // Trigger change event to ensure form validation and calculations
          element.dispatchEvent(new Event("change", { bubbles: true }));
          element.dispatchEvent(new Event("input", { bubbles: true }));

          // For quantity and price fields, trigger keyup to recalculate subtotal
          if (fieldId.includes("cantidad") || fieldId.includes("precio")) {
            element.dispatchEvent(new Event("keyup", { bubbles: true }));
          }

          filledCount++;
          console.log(`Successfully filled ${fieldId}`);
        } else {
          const error = `Element with ID '${fieldId}' not found`;
          console.error(error);
          errors.push(error);
        }
      }
    });
  });

  // Fill "Otros Datos" field
  if (data.otherData) {
    const otherDataElement = document.getElementById(
      "otrosdatosgenerales",
    ) as HTMLTextAreaElement;
    if (otherDataElement) {
      console.log("Filling 'Otros Datos' field");
      otherDataElement.className = "";
      otherDataElement.readOnly = false;
      otherDataElement.value = data.otherData;
      otherDataElement.dispatchEvent(new Event("change", { bubbles: true }));
      otherDataElement.dispatchEvent(new Event("input", { bubbles: true }));
      filledCount++;
    }
  }

  console.log(`Filled ${filledCount} fields, ${errors.length} errors:`, errors);

  // Wait a moment for any calculations to complete, then click continue button
  setTimeout(() => {
    console.log("Looking for continue button...");
    console.log(
      "All buttons on page:",
      Array.from(document.querySelectorAll('input[type="button"], button')).map(
        (btn) => ({
          tagName: btn.tagName,
          type: btn.getAttribute("type"),
          value: btn.getAttribute("value"),
          onclick: btn.getAttribute("onclick"),
          textContent: btn.textContent,
        }),
      ),
    );

    // Try multiple selectors for the continue button
    const buttonSelectors = [
      'input[type="button"][onclick="validarCampos();"]',
      'input[type="button"][onclick*="validarCampos"]',
      'input[type="button"][value*="Continuar"]',
      'input[onclick="validarCampos();"]',
      'input[onclick*="validarCampos"]',
      'input[value="Continuar >"]',
      'input[value*="Continuar"]',
      'button[onclick*="validarCampos"]',
    ];

    let continueButton = null;
    for (const selector of buttonSelectors) {
      continueButton = document.querySelector(selector) as HTMLInputElement;
      if (continueButton) {
        console.log(`Found continue button with selector: ${selector}`);
        break;
      }
    }

    if (continueButton) {
      console.log("Clicking continue button...");
      continueButton.click();
      showNotification(
        `Paso final completado (${filledCount} campos), continuando...`,
        "success",
      );
    } else {
      console.error("Continue button not found.");
      showNotification(
        `Campos completados (${filledCount}), pero no se encontró el botón continuar`,
        "error",
      );
    }
  }, 1500); // Increased timeout to allow for calculations
}

function updateDOMField(fieldId: string, value: string) {
  console.log(`Updating DOM field ${fieldId} with value:`, value);

  const element = document.getElementById(fieldId) as
    | HTMLSelectElement
    | HTMLInputElement;
  if (element) {
    element.value = value;
    // Trigger change event to ensure form validation and dependent field updates
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("input", { bubbles: true }));
    console.log(`Successfully updated DOM field ${fieldId}`);
  } else {
    console.warn(`DOM element with ID '${fieldId}' not found`);
  }
}

function getLineItemRows(table: HTMLTableElement): HTMLTableRowElement[] {
  const tbody = table.querySelector("tbody");
  if (!tbody) {
    console.warn("Could not find tbody in table");
    return [];
  }

  const allRows = Array.from(tbody.querySelectorAll("tr"));
  return allRows.slice(1) as HTMLTableRowElement[];
}

function getLineItemData(row: HTMLTableRowElement) {
  const descriptionField = row.querySelector(
    'textarea[name="detalleDescripcion"]',
  ) as HTMLTextAreaElement;

  if (!descriptionField || !descriptionField.id) {
    return null;
  }

  const lineNumberMatch = descriptionField.id.match(/detalle_descripcion(\d+)/);
  const lineNumber = lineNumberMatch ? parseInt(lineNumberMatch[1]) : 0;

  if (lineNumber === 0) {
    return null;
  }

  const itemCodeField = row.querySelector(
    'input[name="detalleCodigoArticulo"]',
  ) as HTMLInputElement;
  const quantityField = row.querySelector(
    'input[name="detalleCantidad"]',
  ) as HTMLInputElement;
  const measureField = row.querySelector(
    'select[name="detalleMedida"]',
  ) as HTMLSelectElement;
  const priceField = row.querySelector(
    'input[name="detallePrecio"]',
  ) as HTMLInputElement;
  const bonusField = row.querySelector(
    'input[name="detalleImporteBonificacion"]',
  ) as HTMLInputElement;

  return {
    lineNumber: lineNumber,
    itemCode: itemCodeField?.value || "",
    itemDescription: descriptionField.value || "",
    quantity: quantityField?.value || "1",
    unitOfMeasure: measureField?.value || "7",
    unitPrice: priceField?.value || "",
    bonusAmount: bonusField?.value || "",
  };
}

function initializeLineItemTracking() {
  if (!window.location.href.includes("genComDatosOperacion.do")) {
    return;
  }

  const table = document.getElementById("idoperacion") as HTMLTableElement;
  if (!table) {
    console.warn("Could not find table with id 'idoperacion'");
    return;
  }

  const syncLineItemsStructure = () => {
    const rows = getLineItemRows(table);
    const lineItems = rows.map(getLineItemData).filter(Boolean);

    console.log(`Found ${lineItems.length} line items in DOM:`, lineItems);

    // Send updated line items to sidepanel
    browser.runtime
      .sendMessage({
        action: "syncLineItemsStructure",
        lineItems: lineItems,
      })
      .catch((error) => {
        console.log(
          "Could not sync line items (sidepanel might not be open):",
          error,
        );
      });
  };

  syncLineItemsStructure();

  // Use MutationObserver to detect when new elements are added
  const observer = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.type === "childList"))
      syncLineItemsStructure();
  });

  // Start observing
  observer.observe(table, {
    childList: true,
    subtree: true,
  });
}

function showNotification(
  message: string,
  type: "success" | "error" | "info" = "success",
) {
  const notification = document.createElement("div");
  const bgColor =
    type === "success" ? "#4CAF50" : type === "error" ? "#f44336" : "#2196F3";
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 12px 20px;
    background: ${bgColor};
    color: white;
    border-radius: 4px;
    z-index: 10001;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;

  // Add animation keyframes
  if (!document.getElementById("afip-helper-styles")) {
    const style = document.createElement("style");
    style.id = "afip-helper-styles";
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}
