export default defineContentScript({
  matches: ['*://fe.afip.gob.ar/*'],
  main() {
    console.log('AFIP Invoice Helper content script loaded on:', window.location.href);
    
    // Always initialize the helper to listen for messages
    initializeAfipHelper();
    
    // Check if we're on a form page and add floating button
    if (window.location.href.includes('rcel/jsp/index_bis.jsp') || 
        document.querySelector('#destino, #nrodocreceptor, #razonsocialreceptor, #puntodeventa, #universocomprobante')) {
      console.log('AFIP form page detected, adding floating button');
      createFloatingButton();
    }
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
      // Send message to background script to open popup
      await browser.runtime.sendMessage({ action: 'openPopup' });
    } catch (error) {
      console.error('Error requesting popup:', error);
      // Fallback: Show notification only if there's an actual error
      showNotification('Haz clic en el ícono 🇦🇷 en la barra de herramientas para abrir AFIP Helper', 'error');
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
    
    // Try multiple selectors for the continue button
    const buttonSelectors = [
      'input[type="button"][onclick="validarCampos();"]',
      'input[type="button"][value*="Continuar"]',
      'input[onclick="validarCampos();"]',
      'input[value="Continuar >"]'
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
      console.error('Continue button not found. Available buttons:', 
        Array.from(document.querySelectorAll('input[type="button"]')).map(btn => ({
          value: btn.getAttribute('value'),
          onclick: btn.getAttribute('onclick')
        }))
      );
      showNotification(`Campos completados (${filledCount}), pero no se encontró el botón continuar`, 'error');
    }
  }, 500);
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
  
  // Show success notification
  showNotification(`Paso 2 completado (${filledCount} campos)`, 'success');
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

function showNotification(message: string, type: 'success' | 'error' = 'success') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'success' ? '#4CAF50' : '#f44336'};
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
