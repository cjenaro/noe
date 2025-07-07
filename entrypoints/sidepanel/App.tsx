import { createSignal, createEffect, For, Show } from "solid-js";
import { useMachine } from "@xstate/solid";
import { storage, type ClientData } from "../../utils/storage";
import { workflowMachine } from "@/utils/stateMachine";

function App() {
  const [clients, setClients] = createSignal<ClientData[]>([]);
  const [showForm, setShowForm] = createSignal(false);
  const [editingClient, setEditingClient] = createSignal<ClientData | null>(
    null,
  );
  const [isLoading, setIsLoading] = createSignal(true);

  const [stepOne, setStepOne] = createSignal({
    puntoVenta: "",
    tipoComprobante: "",
  });

  const [stepThree, setStepThree] = createSignal({
    paymentMethod: "",
  });

  // Step 2 fields
  const [stepTwo, setStepTwo] = createSignal({
    idioma: "1",
    concepto: "",
    actividad: "",
    fechaComprobante: "",
    monedaExtranjera: false,
    selectedMoneda: "",
  });

  const [state, send] = useMachine(workflowMachine);

  // Helper functions to maintain the same interface
  const getCurrentStep = (): 1 | 2 | 3 => {
    switch (state.value) {
      case "step1":
        return 1;
      case "step2":
        return 2;
      case "step3":
        return 3;
      default:
        return 1;
    }
  };

  const isStepCollapsed = (step: 1 | 2 | 3): boolean => {
    return getCurrentStep() !== step;
  };

  const nextStep = () => {
    send({ type: "NEXT_STEP" });
  };

  // Load data on mount
  createEffect(async () => {
    try {
      const clientsData = await storage.getClients();
      // const machineState = await storage.
      setClients(clientsData);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setIsLoading(false);
    }
  });

  async function fillForm(client: ClientData) {
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
            puntoVenta: stepOne().puntoVenta,
            tipoComprobante: stepOne().tipoComprobante,
          },
        });
      }
    } catch (error) {
      console.error("Error filling form:", error);
    }
  }

  async function fillStep1AndContinue() {
    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.id) {
        throw new Error("No active tab found");
      }

      if (!tab.url?.includes("fe.afip.gob.ar")) {
        throw new Error(
          "No estás en una página de AFIP. Ve a fe.afip.gob.ar primero.",
        );
      }

      console.log("Sending message to tab:", tab.url);

      const response = await browser.tabs.sendMessage(tab.id, {
        action: "fillStep1AndContinue",
        data: {
          puntoVenta: stepOne().puntoVenta,
          tipoComprobante: stepOne().tipoComprobante,
        },
      });

      if (response?.success) {
        showNotification("Paso 1 completado ✓", "success");
        nextStep();
      } else {
        throw new Error(
          response?.error || "Error desconocido del content script",
        );
      }
    } catch (error) {
      console.error("Error filling step 1:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      showNotification(`Error: ${errorMessage}`, "error");
    }
  }

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

  const exportData = async () => {
    try {
      const exportedData = await storage.exportData();
      const blob = new Blob([exportedData], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `afip-helper-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showNotification("Datos exportados exitosamente", "success");
    } catch (error) {
      console.error("Error exporting data:", error);
      showNotification("Error al exportar datos", "error");
    }
  };

  const importData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        await storage.importData(text);
        setClients(await storage.getClients());
        showNotification("Datos importados exitosamente", "success");
      } catch (error) {
        console.error("Error importing data:", error);
        showNotification(
          "Error al importar datos. Verifica que el archivo sea válido.",
          "error",
        );
      }
    };
    input.click();
  };

  async function fillStep2AndContinue() {
    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.id) {
        throw new Error("No active tab found");
      }

      if (!tab.url?.includes("fe.afip.gob.ar")) {
        throw new Error(
          "No estás en una página de AFIP. Ve a fe.afip.gob.ar primero.",
        );
      }

      const {
        idioma,
        selectedMoneda,
        concepto,
        actividad,
        fechaComprobante,
        monedaExtranjera,
      } = stepTwo();

      const response = await browser.tabs.sendMessage(tab.id, {
        action: "fillStep2AndContinue",
        data: {
          idioma,
          concepto,
          actividad,
          fechaComprobante,
          monedaExtranjera,
          moneda: selectedMoneda,
        },
      });

      if (response?.success) {
        showNotification("Paso 2 completado ✓", "success");
        nextStep();
      } else {
        throw new Error(
          response?.error || "Error desconocido del content script",
        );
      }
    } catch (error) {
      console.error("Error filling step 2:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      showNotification(`Error: ${errorMessage}`, "error");
    }
  }

  const showNotification = (message: string, type: "success" | "error") => {
    // Create a simple notification element
    const notification = document.createElement("div");
    notification.className = `fixed top-5 right-5 px-4 py-3 text-white rounded-md text-xs z-[10000] shadow-lg ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  function handleStepOne(key: keyof ReturnType<typeof stepOne>, value: string) {
    setStepOne((o) => ({ ...o, [key]: value }));
  }

  function handleStepTwo(
    key: keyof ReturnType<typeof stepTwo>,
    value: string | boolean,
  ) {
    setStepTwo((o) => ({ ...o, [key]: value }));
  }

  function handleStepThree(
    key: keyof ReturnType<typeof stepThree>,
    value: string,
  ) {
    setStepThree((o) => ({ ...o, [key]: value }));
  }

  return (
    <div class="w-full min-h-screen bg-gray-50 font-sans box-border">
      <header class="bg-blue-600 text-white p-4 text-center">
        <h1 class="text-lg font-semibold mb-1">🇦🇷 AFIP Helper</h1>
        <p class="text-xs opacity-90">
          Gestión de datos para facturas electrónicas
        </p>
      </header>

      <main class="p-4 overflow-y-auto">
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
              <div class="flex gap-2">
                <button
                  class="px-2 py-1.5 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                  onClick={exportData}
                  title="Exportar datos"
                >
                  📤
                </button>
                <button
                  class="px-2 py-1.5 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                  onClick={importData}
                  title="Importar datos"
                >
                  📥
                </button>
              </div>
            </div>

            {/* Step 1: AFIP Form Configuration */}
            <div class="mb-4 border border-blue-200 rounded-md overflow-hidden">
              <div
                class={`p-3 cursor-pointer transition-colors ${isStepCollapsed(1) ? "bg-green-100 border-green-200" : "bg-blue-50"}`}
              >
                <h3
                  class={`text-sm font-medium flex items-center justify-between ${isStepCollapsed(1) ? "text-green-900" : "text-blue-900"}`}
                >
                  <span>
                    {isStepCollapsed(1)
                      ? "✅ Paso 1: Completado"
                      : "📋 Paso 1: Configuración AFIP"}
                  </span>
                  <span class="text-xs">{isStepCollapsed(1) ? "▲" : "▼"}</span>
                </h3>
              </div>

              <Show when={!isStepCollapsed(1)}>
                <div class="p-3 bg-blue-50 border-t border-blue-200">
                  <div class="mb-3">
                    <label class="block text-xs font-medium text-gray-700 mb-2">
                      Punto de Venta *
                    </label>
                    <Autocomplete
                      value={stepOne().puntoVenta}
                      onChange={(value) => handleStepOne("puntoVenta", value)}
                      options={[
                        {
                          value: "4",
                          label:
                            "00004-San Lorenzo 501 Piso:21 Dpto:B - Barrio Nueva Cordoba, Córdoba",
                        },
                        {
                          value: "2",
                          label:
                            "00002-San Lorenzo 501 Piso:21 Dpto:B - Barrio Nueva Cordoba, Córdoba",
                        },
                      ]}
                      placeholder="Seleccionar punto de venta..."
                    />
                  </div>

                  <div class="mb-3">
                    <label class="block text-xs font-medium text-gray-700 mb-2">
                      Tipo de Comprobante *
                    </label>
                    <Autocomplete
                      value={stepOne().tipoComprobante}
                      onChange={(value) =>
                        handleStepOne("tipoComprobante", value)
                      }
                      options={[
                        { value: "39", label: "Factura de Exportación E" },
                        {
                          value: "41",
                          label:
                            "Nota de Débito por Operaciones con el Exterior E",
                        },
                        {
                          value: "43",
                          label:
                            "Nota de Crédito por Operaciones con el Exterior E",
                        },
                      ]}
                      placeholder="Seleccionar tipo de comprobante..."
                    />
                  </div>

                  <button
                    class="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={fillStep1AndContinue}
                    disabled={
                      !stepOne().puntoVenta || !stepOne().tipoComprobante
                    }
                  >
                    Continuar al Paso 2 →
                  </button>
                </div>
              </Show>
            </div>

            {/* Step 2: Invoice Configuration */}
            <div class="mb-4 border border-orange-200 rounded-md overflow-hidden">
              <div
                class={`p-3 cursor-pointer transition-colors ${isStepCollapsed(2) ? "bg-green-100 border-green-200" : "bg-orange-50"}`}
              >
                <h3
                  class={`text-sm font-medium flex items-center justify-between ${isStepCollapsed(2) ? "text-green-900" : "text-orange-900"}`}
                >
                  <span>
                    {isStepCollapsed(2)
                      ? "✅ Paso 2: Completado"
                      : "⚙️ Paso 2: Configuración de Factura"}
                  </span>
                  <span class="text-xs">{isStepCollapsed(2) ? "▲" : "▼"}</span>
                </h3>
              </div>

              <Show when={!isStepCollapsed(2)}>
                <div class="p-3 bg-orange-50 border-t border-orange-200">

                <div class="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-2">
                      Idioma
                    </label>
                    <Autocomplete
                      value={stepTwo().idioma}
                      onChange={(value) => handleStepTwo("idioma", value)}
                      options={[
                        { value: "1", label: "Español" },
                        { value: "2", label: "Inglés" },
                        { value: "3", label: "Portugués" },
                      ]}
                      placeholder="Seleccionar idioma..."
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-2">
                      Fecha (DD/MM/YYYY)
                    </label>
                    <input
                      type="text"
                      value={stepTwo().fechaComprobante}
                      onInput={(e) =>
                        handleStepTwo("fechaComprobante", e.currentTarget.value)
                      }
                      placeholder="01/01/2024"
                      class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div class="mb-3">
                  <label class="block text-xs font-medium text-gray-700 mb-2">
                    Concepto *
                  </label>
                  <Autocomplete
                    value={stepTwo().concepto}
                    onChange={(value) => handleStepTwo("concepto", value)}
                    options={[
                      { value: "1", label: "Exportación definitiva de Bienes" },
                      { value: "2", label: "Servicios" },
                      { value: "4", label: "Otros" },
                    ]}
                    placeholder="Seleccionar concepto..."
                  />
                </div>

                <div class="mb-3">
                  <label class="block text-xs font-medium text-gray-700 mb-2">
                    Actividad
                  </label>
                  <Autocomplete
                    value={stepTwo().actividad}
                    onChange={(v) => handleStepTwo("actividad", v)}
                    options={[
                      {
                        value: "620100",
                        label: "620100 - SERVICIOS DE CONSULTORES EN INF...",
                      },
                    ]}
                    placeholder="Seleccionar actividad..."
                  />
                </div>

                <div class="mb-3">
                  <label class="flex items-center text-xs font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={stepTwo().monedaExtranjera}
                      onChange={(e) =>
                        handleStepTwo("monedaExtranjera", e.target.checked)
                      }
                      class="mr-2"
                    />
                    Moneda Extranjera
                  </label>
                </div>

                <Show when={stepTwo().monedaExtranjera}>
                  <div class="mb-3">
                    <label class="block text-xs font-medium text-gray-700 mb-2">
                      Moneda
                    </label>
                    <Autocomplete
                      value={stepTwo().selectedMoneda}
                      onChange={(value) =>
                        handleStepTwo("selectedMoneda", value)
                      }
                      options={[
                        { value: "DOL", label: "Dólar Estadounidense" },
                        { value: "060", label: "Euro" },
                        { value: "021", label: "Libra Esterlina" },
                        { value: "019", label: "Yens" },
                        { value: "012", label: "Real" },
                        { value: "018", label: "Dólar Canadiense" },
                        { value: "026", label: "Dólar Australiano" },
                        { value: "009", label: "Franco Suizo" },
                      ]}
                      placeholder="Seleccionar moneda..."
                    />
                  </div>
                </Show>

                <button
                  class="w-full px-3 py-2 bg-orange-600 text-white text-sm font-medium rounded hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  onClick={fillStep2AndContinue}
                  disabled={!stepTwo().concepto}
                >
                  Continuar al Paso 3 →
                </button>
                </div>
              </Show>
            </div>

            {/* Step 3: Client Data and Payment Method */}
            <div class="mb-4 border border-green-200 rounded-md overflow-hidden">
              <div
                class={`p-3 cursor-pointer transition-colors ${isStepCollapsed(3) ? "bg-green-100 border-green-200" : "bg-green-50"}`}
              >
                <h3
                  class={`text-sm font-medium flex items-center justify-between ${isStepCollapsed(3) ? "text-green-900" : "text-green-900"}`}
                >
                  <span>
                    {isStepCollapsed(3)
                      ? "✅ Paso 3: Completado"
                      : "👥 Paso 3: Datos del Cliente"}
                  </span>
                  <span class="text-xs">{isStepCollapsed(3) ? "▲" : "▼"}</span>
                </h3>
              </div>

              <Show when={!isStepCollapsed(3)}>
                <div class="p-3 bg-green-50 border-t border-green-200">
                  <div class="mb-3">
                    <label class="block text-xs font-medium text-gray-700 mb-2">
                      Forma de Pago (opcional)
                    </label>
                    <Autocomplete
                      value={stepThree().paymentMethod}
                      onChange={(v) => handleStepThree("paymentMethod", v)}
                      options={[
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
                      ].map((method) => ({ value: method, label: method }))}
                      placeholder="Escribir o seleccionar forma de pago..."
                      allowCustom={true}
                    />
                  </div>
                </div>
              </Show>
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

            <div class="space-y-2">
              <button
                class="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors ml-auto block"
                onClick={() => {
                  setEditingClient(null);
                  setShowForm(true);
                }}
              >
                + Nuevo Cliente
              </button>
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
        <Autocomplete
          value={formData().country}
          onChange={(value) => updateField("country", value)}
          options={[
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
          ]}
          placeholder="Seleccionar país..."
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

// Reusable Autocomplete component
function Autocomplete(props: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  allowCustom?: boolean;
}) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [searchTerm, setSearchTerm] = createSignal("");

  const filteredOptions = () => {
    const term = props.allowCustom ? props.value : searchTerm();
    if (!term) return props.options;
    return props.options.filter((option) =>
      option.label.toLowerCase().includes(term.toLowerCase()),
    );
  };

  const selectedOption = () => {
    return props.options.find((option) => option.value === props.value);
  };

  const displayValue = () => {
    if (props.allowCustom) return props.value;
    return selectedOption()?.label || "";
  };

  const handleSelect = (option: { value: string; label: string }) => {
    props.onChange(option.value);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div class="relative">
      {props.allowCustom ? (
        <input
          type="text"
          value={displayValue()}
          onInput={(e) => props.onChange(e.currentTarget.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder={props.placeholder || "Escribir o seleccionar..."}
          class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      ) : (
        <div
          class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer bg-white"
          onClick={() => setIsOpen(!isOpen())}
        >
          {displayValue() || props.placeholder || "Seleccionar..."}
        </div>
      )}

      <Show when={isOpen()}>
        <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
          {!props.allowCustom && (
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm()}
              onInput={(e) => setSearchTerm(e.currentTarget.value)}
              class="w-full px-2 py-1.5 text-xs border-b border-gray-200 focus:outline-none"
            />
          )}
          <For each={filteredOptions()}>
            {(option) => (
              <div
                class="px-2 py-1.5 text-xs hover:bg-blue-50 cursor-pointer"
                onMouseDown={() => handleSelect(option)}
              >
                {option.label}
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

export default App;
