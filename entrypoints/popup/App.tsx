import { createSignal, createEffect, For, Show } from "solid-js";
import { storage, type ClientData } from "../../utils/storage";

function App() {
  const [clients, setClients] = createSignal<ClientData[]>([]);
  const [showForm, setShowForm] = createSignal(false);
  const [editingClient, setEditingClient] = createSignal<ClientData | null>(
    null,
  );
  const [isLoading, setIsLoading] = createSignal(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = createSignal("");

  // Load data on mount
  createEffect(async () => {
    try {
      const clientsData = await storage.getClients();
      setClients(clientsData);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setIsLoading(false);
    }
  });

  const fillForm = async (client: ClientData) => {
    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab.id) {
        await browser.tabs.sendMessage(tab.id, {
          action: "fillForm",
          data: {
            ...client,
            paymentMethod: selectedPaymentMethod(),
          },
        });
        window.close();
      }
    } catch (error) {
      console.error("Error filling form:", error);
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
      await storage.saveClient(
        clientData as Omit<ClientData, "id" | "createdAt" | "updatedAt">,
      );
    }
    setClients(await storage.getClients());
    setShowForm(false);
    setEditingClient(null);
  };

  return (
    <div
      class="bg-gray-50 font-sans"
      style={{
        width: "400px",
        "min-height": "500px",
        "max-height": "600px",
        "box-sizing": "border-box",
      }}
    >
      <header class="bg-blue-600 text-white p-4 text-center">
        <h1 class="text-lg font-semibold mb-1">🇦🇷 AFIP Helper</h1>
        <p class="text-xs opacity-90">
          Gestión de datos para facturas electrónicas
        </p>
      </header>

      <main class="p-4 max-h-96 overflow-y-auto">
        <Show when={isLoading()}>
          <div class="text-center py-8">
            <p class="text-sm text-gray-500">Cargando...</p>
          </div>
        </Show>

        <Show when={!isLoading()}>
          <div>
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-base font-medium text-gray-900">
                Clientes Guardados
              </h2>
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

            {/* Payment Method Selection - Global for all transactions */}
            <div class="mb-4 p-3 bg-white border border-gray-200 rounded-md">
              <label class="block text-xs font-medium text-gray-700 mb-2">
                Forma de Pago (para esta transacción)
              </label>
              <PaymentMethodSelect
                value={selectedPaymentMethod()}
                onChange={setSelectedPaymentMethod}
              />
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
                      <h3 class="text-sm font-medium text-gray-900">
                        {client.companyName}
                      </h3>
                      <p class="text-xs text-gray-500">CUIT: {client.cuit}</p>
                      <p class="text-xs text-gray-500">{client.email}</p>
                    </div>
                    <div class="flex gap-1">
                      <button
                        class="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                        onClick={() => fillForm(client)}
                        disabled={!selectedPaymentMethod()}
                        title={
                          !selectedPaymentMethod()
                            ? "Selecciona una forma de pago primero"
                            : ""
                        }
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
    companyName: props.client?.companyName || "",
    cuit: props.client?.cuit || "",
    address: props.client?.address || "",
    email: props.client?.email || "",
    country: props.client?.country || "",
    incoterm: props.client?.incoterm || "",
    incotermDetail: props.client?.incotermDetail || "",
    otherData: props.client?.otherData || "",
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    props.onSave(formData());
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form
      class="bg-white border border-gray-200 rounded-md p-4 mb-4"
      onSubmit={handleSubmit}
    >
      <h3 class="text-base font-medium text-gray-900 mb-4">
        {props.client ? "Editar Cliente" : "Nuevo Cliente"}
      </h3>

      <div class="mb-3">
        <label class="block text-xs font-medium text-gray-700 mb-1">
          Razón Social *
        </label>
        <input
          type="text"
          value={formData().companyName}
          onInput={(e) => updateField("companyName", e.currentTarget.value)}
          class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div class="mb-3">
        <label class="block text-xs font-medium text-gray-700 mb-1">
          CUIT *
        </label>
        <input
          type="text"
          value={formData().cuit}
          onInput={(e) => updateField("cuit", e.currentTarget.value)}
          class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div class="mb-3">
        <label class="block text-xs font-medium text-gray-700 mb-1">
          Domicilio
        </label>
        <input
          type="text"
          value={formData().address}
          onInput={(e) => updateField("address", e.currentTarget.value)}
          class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div class="mb-3">
        <label class="block text-xs font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={formData().email}
          onInput={(e) => updateField("email", e.currentTarget.value)}
          class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div class="mb-3">
        <label class="block text-xs font-medium text-gray-700 mb-1">
          País Destino
        </label>
        <CountrySelect
          value={formData().country}
          onChange={(value) => updateField("country", value)}
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

// Country autocomplete component
function CountrySelect(props: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [searchTerm, setSearchTerm] = createSignal("");

  const countries = [
    { value: "200", label: "ARGENTINA" },
    { value: "212", label: "ESTADOS UNIDOS" },
    { value: "203", label: "BRASIL" },
    { value: "208", label: "CHILE" },
    { value: "225", label: "URUGUAY" },
    { value: "221", label: "PARAGUAY" },
    { value: "202", label: "BOLIVIA" },
    { value: "222", label: "PERU" },
    { value: "205", label: "COLOMBIA" },
    { value: "226", label: "VENEZUELA" },
    { value: "210", label: "ECUADOR" },
    { value: "410", label: "ESPAÑA" },
    { value: "412", label: "FRANCIA" },
    { value: "417", label: "ITALIA" },
    { value: "438", label: "ALEMANIA,REP.FED." },
    { value: "426", label: "REINO UNIDO" },
    { value: "204", label: "CANADA" },
    { value: "218", label: "MEXICO" },
    { value: "320", label: "JAPON" },
    { value: "310", label: "CHINA" },
    { value: "501", label: "AUSTRALIA" },
  ];

  const filteredCountries = () => {
    if (!searchTerm()) return countries;
    return countries.filter((country) =>
      country.label.toLowerCase().includes(searchTerm().toLowerCase()),
    );
  };

  const selectedCountry = () => {
    return countries.find((c) => c.value === props.value);
  };

  return (
    <div class="relative">
      <div
        class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer bg-white"
        onClick={() => setIsOpen(!isOpen())}
      >
        {selectedCountry()?.label || "Seleccionar país..."}
      </div>

      <Show when={isOpen()}>
        <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
          <input
            type="text"
            placeholder="Buscar país..."
            value={searchTerm()}
            onInput={(e) => setSearchTerm(e.currentTarget.value)}
            class="w-full px-2 py-1.5 text-xs border-b border-gray-200 focus:outline-none"
          />
          <For each={filteredCountries()}>
            {(country) => (
              <div
                class="px-2 py-1.5 text-xs hover:bg-blue-50 cursor-pointer"
                onClick={() => {
                  props.onChange(country.value);
                  setIsOpen(false);
                  setSearchTerm("");
                }}
              >
                {country.label}
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

// Payment method autocomplete component
function PaymentMethodSelect(props: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = createSignal(false);

  const paymentMethods = [
    "A percibir en USDT",
    "A percibir en BTC",
    "A percibir en ETH",
    "A percibir en USDC",
    "A percibir en DAI",
    "A percibir en ARS",
    "A percibir en USD",
    "A percibir en EUR",
    "Transferencia bancaria",
    "Efectivo",
    "Cheque",
    "Tarjeta de crédito",
    "Tarjeta de débito",
    "Mercado Pago",
    "PayPal",
    "Western Union",
    "MoneyGram",
  ];

  const filteredMethods = () => {
    if (!props.value) return paymentMethods;
    return paymentMethods.filter((method) =>
      method.toLowerCase().includes(props.value.toLowerCase()),
    );
  };

  return (
    <div class="relative">
      <input
        type="text"
        value={props.value}
        onInput={(e) => props.onChange(e.currentTarget.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder="Escribir o seleccionar..."
        class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />

      <Show when={isOpen()}>
        <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
          <For each={filteredMethods()}>
            {(method) => (
              <div
                class="px-2 py-1.5 text-xs hover:bg-blue-50 cursor-pointer"
                onMouseDown={() => {
                  props.onChange(method);
                  setIsOpen(false);
                }}
              >
                {method}
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

export default App;

