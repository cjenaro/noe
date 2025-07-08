import { createSignal, createEffect, For, Show } from "solid-js";
import { useMachine } from "@xstate/solid";
import { storage, type ClientData } from "../../utils/storage";
import { workflowMachine } from "@/utils/stateMachine";
import { Autocomplete, CountryAutocomplete } from "./autocompletes";
import { StepOne } from "./step-one";
import { StepTwo } from "./step-two";
import { StepThree } from "./step-three";
import { StepFour } from "./step-four";

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
    selectedClientId: "",
  });

  const [stepFour, setStepFour] = createSignal({
    lineItems: [
      {
        lineNumber: 1,
        itemCode: "",
        itemDescription: "",
        quantity: "1",
        unitOfMeasure: "7",
        unitPrice: "",
        bonusAmount: "",
      },
    ],
    otherData: "",
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

  function getCurrentStep() {
    switch (state.value) {
      case "step1":
        return 1;
      case "step2":
        return 2;
      case "step3":
        return 3;
      case "step4":
        return 4;
      default:
        return 1;
    }
  }

  function isStepCollapsed(step: 1 | 2 | 3 | 4) {
    return getCurrentStep() !== step;
  }

  function nextStep() {
    send({ type: "NEXT_STEP" });
  }

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

  // Listen for step sync messages from content script
  createEffect(() => {
    const handleMessage = (message: any) => {
      if (message.action === "syncStep") {
        console.log(`Syncing to step ${message.step} from URL: ${message.url}`);

        // Update state machine to match the current step
        const targetStep = message.step;
        const currentStep = getCurrentStep();

        if (targetStep !== currentStep) {
          send({ type: "GO_TO_STEP" + targetStep });
        }
      } else if (message.action === "syncLineItemsStructure") {
        console.log("new line items:", message.lineItems);
        setStepFour((prev) => ({
          ...prev,
          lineItems: message.lineItems || [],
        }));
      }
    };

    // Listen for messages from background script
    browser.runtime.onMessage.addListener(handleMessage);

    // Cleanup listener on component unmount
    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  });

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

  async function fillStep3AndContinue() {
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

      // Get selected client data
      const selectedClientId = stepThree().selectedClientId;
      if (!selectedClientId) {
        throw new Error("Debe seleccionar un cliente");
      }

      const clientsData = await storage.getClients();
      const selectedClient = clientsData.find(
        (client) => client.id === selectedClientId,
      );

      if (!selectedClient) {
        throw new Error("Cliente seleccionado no encontrado");
      }

      const response = await browser.tabs.sendMessage(tab.id, {
        action: "fillStep3AndContinue",
        data: {
          ...selectedClient,
          paymentMethod: stepThree().paymentMethod,
        },
      });

      if (response?.success) {
        showNotification("Paso 3 completado ✓", "success");
        nextStep();
      } else {
        throw new Error(
          response?.error || "Error desconocido del content script",
        );
      }
    } catch (error) {
      console.error("Error filling step 3:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      showNotification(`Error: ${errorMessage}`, "error");
    }
  }

  async function fillStep4AndContinue() {
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

      const response = await browser.tabs.sendMessage(tab.id, {
        action: "fillFinalStep",
        data: stepFour(),
      });

      if (response?.success) {
        showNotification("Paso 4 completado ✓", "success");
        // Don't call nextStep() as this is the final step
      } else {
        throw new Error(
          response?.error || "Error desconocido del content script",
        );
      }
    } catch (error) {
      console.error("Error filling step 4:", error);
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

  function handleStepFour(
    key: keyof ReturnType<typeof stepFour>,
    value:
      | string
      | {
          itemCode: string;
          itemDescription: string;
          quantity: string;
          unitOfMeasure: string;
          unitPrice: string;
          bonusAmount: string;
        }[],
  ) {
    setStepFour((o) => ({ ...o, [key]: value }));
  }

  return (
    <div class="w-full min-h-screen bg-gray-50 font-sans box-border">
      <header class="bg-blue-600 text-white p-4 text-center">
        <h1 class="text-lg font-semibold mb-1">🇦🇷 AFIP Helper</h1>
        <p class="text-xs opacity-90">
          Gestión de datos para facturas electrónicas
        </p>
      </header>

      <main class="p-4">
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

            <StepOne
              isCollapsed={isStepCollapsed(1)}
              stepData={stepOne()}
              onFieldChange={handleStepOne}
              onContinue={fillStep1AndContinue}
            />

            <StepTwo
              isCollapsed={isStepCollapsed(2)}
              stepData={stepTwo()}
              onFieldChange={handleStepTwo}
              onContinue={fillStep2AndContinue}
            />

            <StepThree
              isCollapsed={isStepCollapsed(3)}
              stepData={stepThree()}
              onFieldChange={handleStepThree}
              onContinue={fillStep3AndContinue}
            />

            <StepFour
              isCollapsed={isStepCollapsed(4)}
              stepData={stepFour()}
              onFieldChange={handleStepFour}
              onContinue={fillStep4AndContinue}
            />

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
        <CountryAutocomplete
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

export default App;
