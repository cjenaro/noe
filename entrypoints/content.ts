export default defineContentScript({
  matches: ['*://fe.afip.gob.ar/*'],
  main() {
    console.log('AFIP Invoice Helper loaded');
    
    // Check if we're on the invoice form page
    if (window.location.href.includes('rcel/jsp/index_bis.jsp') || 
        document.querySelector('#destino, #nrodocreceptor, #razonsocialreceptor')) {
      initializeAfipHelper();
    }
  },
});

function initializeAfipHelper() {
  console.log('AFIP form detected, initializing helper...');
  
  // Add floating action button for quick access
  createFloatingButton();
  
  // Listen for messages from popup
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'fillForm') {
      fillAfipForm(message.data);
      sendResponse({ success: true });
    } else if (message.action === 'extractForm') {
      const formData = extractFormData();
      sendResponse({ data: formData });
    }
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
  
  button.addEventListener('click', () => {
    browser.runtime.sendMessage({ action: 'openPopup' });
  });
  
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
  });
  
  document.body.appendChild(button);
}

function fillAfipForm(data: any) {
  const fields = {
    destino: data.country,
    nrodocreceptor: data.cuit,
    nrodocextranjeroreceptor: data.foreignTaxId,
    razonsocialreceptor: data.companyName,
    domicilioreceptor: data.address,
    email: data.email,
    descripcionformadepago: data.paymentMethod,
    incoterm: data.incoterm,
    detalleincoterm: data.incotermDetail,
    otrosdatoscomerciales: data.otherData
  };
  
  Object.entries(fields).forEach(([fieldId, value]) => {
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
  showNotification('Formulario completado exitosamente', 'success');
}

function extractFormData() {
  const getValue = (id: string) => {
    const element = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    return element?.value || '';
  };
  
  return {
    country: getValue('destino'),
    cuit: getValue('nrodocreceptor'),
    foreignTaxId: getValue('nrodocextranjeroreceptor'),
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
