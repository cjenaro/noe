import { createSignal, createEffect, For, Show } from 'solid-js';
import { storage, type ClientData } from '../../utils/storage';
import './App.css';

type Tab = 'clients' | 'templates' | 'settings';

function App() {
  const [activeTab, setActiveTab] = createSignal<Tab>('clients');
  const [clients, setClients] = createSignal<ClientData[]>([]);
  const [showForm, setShowForm] = createSignal(false);
  const [editingClient, setEditingClient] = createSignal<ClientData | null>(null);

  // Load data on mount
  createEffect(async () => {
    const clientsData = await storage.getClients();
    setClients(clientsData);
  });

  const fillForm = async (client: ClientData) => {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        await browser.tabs.sendMessage(tab.id, {
          action: 'fillForm',
          data: client
        });
        window.close();
      }
    } catch (error) {
      console.error('Error filling form:', error);
    }
  };

  const deleteClient = async (id: string) => {
    await storage.deleteClient(id);
    setClients(await storage.getClients());
  };

  const saveClient = async (clientData: Partial<ClientData>) => {
    if (editingClient()) {
      await storage.updateClient(editingClient()!.id, clientData);
    } else {
      await storage.saveClient(clientData as Omit<ClientData, 'id' | 'createdAt' | 'updatedAt'>);
    }
    setClients(await storage.getClients());
    setShowForm(false);
    setEditingClient(null);
  };

  return (
    <div class="w-96 min-h-[500px] bg-gray-50 font-sans">
      <header class="bg-blue-600 text-white p-4 text-center">
        <h1 class="text-lg font-semibold mb-1">🇦🇷 AFIP Helper</h1>
        <p class="text-xs opacity-90">Gestión de datos para facturas electrónicas</p>
      </header>

      <nav class="flex bg-white border-b border-gray-200">
        <button 
          class={`flex-1 py-3 px-2 text-xs transition-colors ${
            activeTab() === 'clients' 
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('clients')}
        >
          Clientes
        </button>
        <button 
          class={`flex-1 py-3 px-2 text-xs transition-colors ${
            activeTab() === 'templates' 
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('templates')}
        >
          Plantillas
        </button>
        <button 
          class={`flex-1 py-3 px-2 text-xs transition-colors ${
            activeTab() === 'settings' 
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('settings')}
        >
          Configuración
        </button>
      </nav>

      <main class="p-4 max-h-96 overflow-y-auto">
        <Show when={activeTab() === 'clients'}>
          <div>
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-base font-medium text-gray-900">Clientes Guardados</h2>
              <button 
                class="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                onClick={() => {
                  setEditingClient(null);
                  setShowForm(true);
                }}
              >
                + Nuevo Cliente
              </button>
            </div>

            <Show when={showForm()}>
              <ClientForm 
                client={editingClient()}
                onSave={saveClient}
                onCancel={() => {
                  setShowForm(false);
                  setEditingClient(null);
                }}
              />
            </Show>

            <div class="space-y-2 max-h-72 overflow-y-auto">
              <For each={clients()}>
                {(client) => (
                  <div class="bg-white border border-gray-200 rounded-md p-3 flex justify-between items-center">
                    <div class="flex-1">
                      <h3 class="text-sm font-medium text-gray-900">{client.companyName}</h3>
                      <p class="text-xs text-gray-500">CUIT: {client.cuit}</p>
                      <p class="text-xs text-gray-500">{client.email}</p>
                    </div>
                    <div class="flex gap-1">
                      <button 
                        class="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                        onClick={() => fillForm(client)}
                      >
                        Usar
                      </button>
                      <button 
                        class="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                        onClick={() => {
                          setEditingClient(client);
                          setShowForm(true);
                        }}
                      >
                        Editar
                      </button>
                      <button 
                        class="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                        onClick={() => deleteClient(client.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </For>
            </div>

            <Show when={clients().length === 0 && !showForm()}>
              <div class="text-center py-8 text-gray-500">
                <p class="text-sm mb-4">No hay clientes guardados</p>
                <button 
                  class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  onClick={() => setShowForm(true)}
                >
                  Crear primer cliente
                </button>
              </div>
            </Show>
          </div>
        </Show>

        <Show when={activeTab() === 'templates'}>
          <div class="text-center py-8">
            <h2 class="text-base font-medium text-gray-900 mb-2">Plantillas de Factura</h2>
            <p class="text-sm text-gray-500">Próximamente...</p>
          </div>
        </Show>

        <Show when={activeTab() === 'settings'}>
          <div class="text-center py-8">
            <h2 class="text-base font-medium text-gray-900 mb-2">Configuración</h2>
            <p class="text-sm text-gray-500">Próximamente...</p>
          </div>
        </Show>
      </main>
    </div>
  );
}

function ClientForm(props: {
  client: ClientData | null;
  onSave: (data: Partial<ClientData>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = createSignal({
    companyName: props.client?.companyName || '',
    cuit: props.client?.cuit || '',
    foreignTaxId: props.client?.foreignTaxId || '',
    address: props.client?.address || '',
    email: props.client?.email || '',
    country: props.client?.country || '',
    paymentMethod: props.client?.paymentMethod || '',
    incoterm: props.client?.incoterm || '',
    incotermDetail: props.client?.incotermDetail || '',
    otherData: props.client?.otherData || ''
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    props.onSave(formData());
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form class="bg-white border border-gray-200 rounded-md p-4 mb-4" onSubmit={handleSubmit}>
      <h3 class="text-base font-medium text-gray-900 mb-4">
        {props.client ? 'Editar Cliente' : 'Nuevo Cliente'}
      </h3>
      
      <div class="mb-3">
        <label class="block text-xs font-medium text-gray-700 mb-1">Razón Social *</label>
        <input 
          type="text" 
          value={formData().companyName}
          onInput={(e) => updateField('companyName', e.currentTarget.value)}
          class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div class="mb-3">
        <label class="block text-xs font-medium text-gray-700 mb-1">CUIT *</label>
        <input 
          type="text" 
          value={formData().cuit}
          onInput={(e) => updateField('cuit', e.currentTarget.value)}
          class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div class="mb-3">
        <label class="block text-xs font-medium text-gray-700 mb-1">ID Impositivo</label>
        <input 
          type="text" 
          value={formData().foreignTaxId}
          onInput={(e) => updateField('foreignTaxId', e.currentTarget.value)}
          class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div class="mb-3">
        <label class="block text-xs font-medium text-gray-700 mb-1">Domicilio</label>
        <input 
          type="text" 
          value={formData().address}
          onInput={(e) => updateField('address', e.currentTarget.value)}
          class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div class="mb-3">
        <label class="block text-xs font-medium text-gray-700 mb-1">Email</label>
        <input 
          type="email" 
          value={formData().email}
          onInput={(e) => updateField('email', e.currentTarget.value)}
          class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div class="flex gap-2 justify-end mt-4">
        <button 
          type="button" 
          class="px-3 py-1.5 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
          onClick={props.onCancel}
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          class="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}

export default App;
