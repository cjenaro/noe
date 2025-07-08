import { Show, For } from "solid-js";

interface LineItem {
  lineNumber: number;
  itemCode: string;
  itemDescription: string;
  quantity: string;
  unitOfMeasure: string;
  unitPrice: string;
  bonusAmount: string;
}

interface StepFourProps {
  isCollapsed: boolean;
  stepData: {
    lineItems: LineItem[];
    otherData: string;
  };
  onFieldChange: (
    key: keyof StepFourProps["stepData"],
    value: string | LineItem[],
  ) => void;
  onContinue: () => void;
}

export function StepFour(props: StepFourProps) {
  function updateLineItem(index: number, field: keyof LineItem, value: string) {
    const newLineItems = [...props.stepData.lineItems];
    const lineItem = newLineItems[index];
    newLineItems[index] = { ...lineItem, [field]: value };
    props.onFieldChange("lineItems", newLineItems);
  }

  const syncOtherDataToDOM = async (value: string) => {
    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.id) return;
      if (!tab.url?.includes("fe.afip.gob.ar")) return;

      await browser.tabs.sendMessage(tab.id, {
        action: "updateDOMField",
        fieldId: "otrosdatosgenerales",
        value: value,
      });
    } catch (error) {
      console.log("Could not sync other data to DOM:", error);
    }
  };

  const hasValidLineItems = () => {
    return (
      props.stepData.lineItems.length > 0 &&
      props.stepData.lineItems.some(
        (item) => item.itemDescription.trim() !== "",
      )
    );
  };

  return (
    <div class="mb-4 border border-purple-200 rounded-md overflow-hidden">
      <div
        class={`p-3 cursor-pointer transition-colors ${props.isCollapsed ? "bg-green-100 border-green-200" : "bg-purple-50"}`}
      >
        <h3
          class={`text-sm font-medium flex items-center justify-between ${props.isCollapsed ? "text-green-900" : "text-purple-900"}`}
        >
          <span>
            {props.isCollapsed
              ? "✅ Paso 4: Completado"
              : "📋 Paso 4: Detalles de Items"}
          </span>
          <span class="text-xs">{props.isCollapsed ? "▲" : "▼"}</span>
        </h3>
      </div>

      <Show when={!props.isCollapsed}>
        <div class="p-3 bg-purple-50 border-t border-purple-200">
          <div class="mb-4">
            <div class="mb-3">
              <h4 class="text-sm font-medium text-gray-700">
                Items de la Factura
              </h4>
              <p class="text-xs text-gray-500 mt-1">
                Use los botones "Agregar línea descripción" y "X" en la página
                de AFIP para gestionar las líneas
              </p>
            </div>

            <For each={props.stepData.lineItems}>
              {(item, index) => (
                <div class="mb-4 p-3 bg-white border border-gray-200 rounded">
                  <div class="mb-2">
                    <h5 class="text-xs font-medium text-gray-600">
                      Línea {item.lineNumber}
                    </h5>
                  </div>

                  <div class="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">
                        Código del Item
                      </label>
                      <input
                        type="text"
                        value={item.itemCode}
                        onInput={(e) =>
                          updateLineItem(
                            index(),
                            "itemCode",
                            e.currentTarget.value,
                          )
                        }
                        placeholder="Código..."
                        class="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">
                        Cantidad
                      </label>
                      <input
                        type="text"
                        value={item.quantity}
                        onInput={(e) =>
                          updateLineItem(
                            index(),
                            "quantity",
                            e.currentTarget.value,
                          )
                        }
                        placeholder="1"
                        class="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div class="mb-2">
                    <label class="block text-xs font-medium text-gray-700 mb-1">
                      Descripción del Item *
                    </label>
                    <textarea
                      value={item.itemDescription}
                      onInput={(e) =>
                        updateLineItem(
                          index(),
                          "itemDescription",
                          e.currentTarget.value,
                        )
                      }
                      placeholder="Descripción del servicio o producto..."
                      class="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      rows="2"
                    />
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">
                        Precio Unitario
                      </label>
                      <input
                        type="text"
                        value={item.unitPrice}
                        onInput={(e) =>
                          updateLineItem(
                            index(),
                            "unitPrice",
                            e.currentTarget.value,
                          )
                        }
                        placeholder="0.00"
                        class="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">
                        Importe Bonificación
                      </label>
                      <input
                        type="text"
                        value={item.bonusAmount}
                        onInput={(e) =>
                          updateLineItem(
                            index(),
                            "bonusAmount",
                            e.currentTarget.value,
                          )
                        }
                        placeholder="0.00"
                        class="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>

          <div class="mb-3">
            <label class="block text-xs font-medium text-gray-700 mb-2">
              Otros Datos
            </label>
            <textarea
              value={props.stepData.otherData}
              onInput={(e) => {
                const value = e.currentTarget.value;
                props.onFieldChange("otherData", value);
                syncOtherDataToDOM(value);
              }}
              placeholder="Información adicional..."
              class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              rows="2"
            />
          </div>

          <button
            class="w-full px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={props.onContinue}
            disabled={!hasValidLineItems()}
          >
            Completar Factura ✓
          </button>
        </div>
      </Show>
    </div>
  );
}

