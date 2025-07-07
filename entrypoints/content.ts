export default defineContentScript({
  matches: ['*://fe.afip.gob.ar/*'],
  main() {
    console.log('AFIP Invoice Helper content script loaded on:', window.location.href);
    
    // Always initialize the helper to listen for messages
    initializeAfipHelper();
    
    // Always show floating button on AFIP pages
    console.log('AFIP page detected, adding floating button');
    createFloatingButton();
  },
});

function initializeAfipHelper() {
  console.log('AFIP helper initializing message listeners...');
  
  // Listen for messages from popup
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('Content script received message:', message);
    
    try {
      if (message.action === 'fillForm') {
        fillAfipForm(message.data);
        sendResponse({ success: true });
      } else if (message.action === 'fillStep1AndContinue') {
        fillStep1AndContinue(message.data);
        sendResponse({ success: true });
      } else if (message.action === 'fillStep2AndContinue') {
        fillStep2AndContinue(message.data);
        sendResponse({ success: true });
      } else if (message.action === 'extractForm') {
        const formData = extractFormData();
        sendResponse({ data: formData });
      } else if (message.action === 'getSelectOptions') {
        const options = getSelectOptions(message.fieldId);
        sendResponse({ success: true, options });
      } else if (message.action === 'updateDOMField') {
        updateDOMField(message.fieldId, message.value);
        sendResponse({ success: true });
      } else {
        console.log('Unknown action:', message.action);
        sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      sendResponse({ success: false, error: errorMessage });
    }
    
    // Return true to indicate we will send a response asynchronously
    return true;
  });
}

function createFloatingButton() {
  const button = document.createElement('div');
  button.id = 'afip-helper-btn';
  button.innerHTML = '🇦🇷';
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
  
  button.addEventListener('click', async () => {
    try {
      // Send message to background script to open sidebar/sidepanel
      const response = await browser.runtime.sendMessage({ command: 'openSidebar' });
      if (response?.success) {
        showNotification('Panel lateral abierto ✓', 'success');
      } else {
        showNotification('Error al abrir panel: ' + (response?.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error requesting sidebar:', error);
      showNotification('Error al abrir panel lateral', 'error');
    }
  });
  
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
  });
  
  document.body.appendChild(button);
}

function fillStep1AndContinue(data: any) {
  console.log('fillStep1AndContinue called with data:', data);
  console.log('Current page URL:', window.location.href);
  
  // Fill first step fields only
  const firstStepFields = {
    puntodeventa: data.puntoVenta,
    universocomprobante: data.tipoComprobante
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
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('input', { bubbles: true }));
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
    console.log('Looking for continue button...');
    console.log('All buttons on page:', Array.from(document.querySelectorAll('input[type="button"], button')).map(btn => ({
      tagName: btn.tagName,
      type: btn.getAttribute('type'),
      value: btn.getAttribute('value'),
      onclick: btn.getAttribute('onclick'),
      textContent: btn.textContent
    })));
    
    // Try multiple selectors for the continue button
    const buttonSelectors = [
      'input[type="button"][onclick="validarCampos();"]',
      'input[type="button"][onclick*="validarCampos"]',
      'input[type="button"][value*="Continuar"]',
      'input[onclick="validarCampos();"]',
      'input[onclick*="validarCampos"]',
      'input[value="Continuar >"]',
      'input[value*="Continuar"]',
      'button[onclick*="validarCampos"]'
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
      console.log('Clicking continue button...');
      continueButton.click();
      showNotification(`Paso 1 completado (${filledCount} campos), continuando...`, 'success');
    } else {
      console.error('Continue button not found.');
      showNotification(`Campos completados (${filledCount}), pero no se encontró el botón continuar`, 'error');
    }
  }, 1000); // Increased timeout to 1 second
}

function fillStep2AndContinue(data: any) {
  console.log('fillStep2AndContinue called with data:', data);
  
  // Step 2 fields mapping
  const step2Fields = {
    ididioma: data.idioma,
    fc: data.fechaComprobante, // fecha comprobante
    idconcepto: data.concepto,
    actiAsociadaId: data.actividad,
    monedaextranjera: data.monedaExtranjera ? 'on' : '', // checkbox
    moneda: data.moneda
  };
  
  let filledCount = 0;
  let errors: string[] = [];
  
  // Fill step 2 fields
  Object.entries(step2Fields).forEach(([fieldId, value]) => {
    console.log(`Trying to fill field ${fieldId} with value:`, value);
    if (value !== undefined && value !== '') {
      const element = document.getElementById(fieldId) as HTMLInputElement | HTMLSelectElement;
      if (element) {
        console.log(`Found element ${fieldId}, setting value...`);
        
        if (element.type === 'checkbox') {
          (element as HTMLInputElement).checked = value === 'on';
          // Trigger click event for checkboxes to ensure proper handling
          element.click();
        } else {
          element.value = value;
        }
        
        // Trigger change event to ensure form validation and dependent field updates
        element.dispatchEvent(new Event('change', { bubbles: true }));
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
    console.log('Looking for continue button...');
    console.log('Current page URL:', window.location.href);
    console.log('All buttons on page:', Array.from(document.querySelectorAll('input[type="button"], button')).map(btn => ({
      tagName: btn.tagName,
      type: btn.getAttribute('type'),
      value: btn.getAttribute('value'),
      onclick: btn.getAttribute('onclick'),
      textContent: btn.textContent
    })));
    
    // Try multiple selectors for the continue button
    const buttonSelectors = [
      'input[type="button"][onclick="validarCampos();"]',
      'input[type="button"][onclick*="validarCampos"]',
      'input[type="button"][value*="Continuar"]',
      'input[onclick="validarCampos();"]',
      'input[onclick*="validarCampos"]',
      'input[value="Continuar >"]',
      'input[value*="Continuar"]',
      'button[onclick*="validarCampos"]'
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
      console.log('Clicking continue button...');
      continueButton.click();
      showNotification(`Paso 2 completado (${filledCount} campos), continuando...`, 'success');
    } else {
      console.error('Continue button not found.');
      showNotification(`Campos completados (${filledCount}), pero no se encontró el botón continuar`, 'error');
    }
  }, 1000); // Increased timeout to 1 second
}

function fillAfipForm(data: any) {
  // First step fields (punto de venta and tipo de comprobante)
  const firstStepFields = {
    puntodeventa: data.puntoVenta,
    universocomprobante: data.tipoComprobante
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
    otrosdatoscomerciales: data.otherData
  };
  
  // Fill first step fields
  Object.entries(firstStepFields).forEach(([fieldId, value]) => {
    if (value) {
      const element = document.getElementById(fieldId) as HTMLSelectElement;
      if (element) {
        element.value = value;
        // Trigger change event to ensure form validation and dependent field updates
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
  
  // Fill second step fields
  Object.entries(secondStepFields).forEach(([fieldId, value]) => {
    if (value) {
      const element = document.getElementById(fieldId) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      if (element) {
        element.value = value;
        // Trigger change event to ensure form validation
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
  
  // Show success notification
  const filledFields = Object.values({...firstStepFields, ...secondStepFields}).filter(Boolean).length;
  showNotification(`Formulario completado: ${filledFields} campos rellenados`, 'success');
}

function extractFormData() {
  const getValue = (id: string) => {
    const element = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    return element?.value || '';
  };
  
  return {
    country: getValue('destino'),
    cuit: getValue('nrodocreceptor'), // Use CUIT as primary value
    companyName: getValue('razonsocialreceptor'),
    address: getValue('domicilioreceptor'),
    email: getValue('email'),
    paymentMethod: getValue('descripcionformadepago'),
    incoterm: getValue('incoterm'),
    incotermDetail: getValue('detalleincoterm'),
    otherData: getValue('otrosdatoscomerciales')
  };
}

function getSelectOptions(fieldId: string): Array<{ value: string; label: string }> {
  console.log(`Getting options for field: ${fieldId}`);
  
  const selectElement = document.getElementById(fieldId) as HTMLSelectElement;
  if (!selectElement) {
    console.warn(`Select element with ID '${fieldId}' not found`);
    return [];
  }
  
  const options: Array<{ value: string; label: string }> = [];
  
  // Get all option elements
  const optionElements = selectElement.querySelectorAll('option');
  
  optionElements.forEach((option) => {
    const value = option.value;
    const label = option.textContent?.trim() || option.innerText?.trim() || '';
    
    // Skip empty options or placeholder options
    if (value && value !== '' && label && label !== 'Seleccionar...') {
      options.push({ value, label });
    }
  });
  
  console.log(`Found ${options.length} options for ${fieldId}:`, options);
  return options;
}

function updateDOMField(fieldId: string, value: string) {
  console.log(`Updating DOM field ${fieldId} with value:`, value);
  
  const element = document.getElementById(fieldId) as HTMLSelectElement | HTMLInputElement;
  if (element) {
    element.value = value;
    // Trigger change event to ensure form validation and dependent field updates
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('input', { bubbles: true }));
    console.log(`Successfully updated DOM field ${fieldId}`);
  } else {
    console.warn(`DOM element with ID '${fieldId}' not found`);
  }
}

function showNotification(message: string, type: 'success' | 'error' | 'info' = 'success') {
  const notification = document.createElement('div');
  const bgColor = type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3';
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
  if (!document.getElementById('afip-helper-styles')) {
    const style = document.createElement('style');
    style.id = 'afip-helper-styles';
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
