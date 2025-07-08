import { Show } from "solid-js";

interface StepFourProps {
  isCollapsed: boolean;
  stepData: {
    itemCode: string;
    itemDescription: string;
    quantity: string;
    unitOfMeasure: string;
    unitPrice: string;
    bonusAmount: string;
    otherData: string;
  };
  onFieldChange: (key: keyof StepFourProps["stepData"], value: string) => void;
  onContinue: () => void;
}

export function StepFour(props: StepFourProps) {
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
              : "📋 Paso 4: Detalles del Item"}
          </span>
          <span class="text-xs">{props.isCollapsed ? "▲" : "▼"}</span>
        </h3>
      </div>

      <Show when={!props.isCollapsed}>
        <div class="p-3 bg-purple-50 border-t border-purple-200">
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-2">
                Código del Item
              </label>
              <input
                type="text"
                value={props.stepData.itemCode}
                onInput={(e) =>
                  props.onFieldChange("itemCode", e.currentTarget.value)
                }
                placeholder="Código..."
                class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-2">
                Cantidad
              </label>
              <input
                type="text"
                value={props.stepData.quantity}
                onInput={(e) =>
                  props.onFieldChange("quantity", e.currentTarget.value)
                }
                placeholder="1"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          <div class="mb-3">
            <label class="block text-xs font-medium text-gray-700 mb-2">
              Descripción del Item *
            </label>
            <textarea
              value={props.stepData.itemDescription}
              onInput={(e) =>
                props.onFieldChange("itemDescription", e.currentTarget.value)
              }
              placeholder="Descripción del servicio o producto..."
              class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              rows="3"
            />
          </div>

          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-2">
                Precio Unitario
              </label>
              <input
                type="text"
                value={props.stepData.unitPrice}
                onInput={(e) =>
                  props.onFieldChange("unitPrice", e.currentTarget.value)
                }
                placeholder="0.00"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-2">
                Importe Bonificación
              </label>
              <input
                type="text"
                value={props.stepData.bonusAmount}
                onInput={(e) =>
                  props.onFieldChange("bonusAmount", e.currentTarget.value)
                }
                placeholder="0.00"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          <div class="mb-3">
            <label class="block text-xs font-medium text-gray-700 mb-2">
              Otros Datos
            </label>
            <textarea
              value={props.stepData.otherData}
              onInput={(e) =>
                props.onFieldChange("otherData", e.currentTarget.value)
              }
              placeholder="Información adicional..."
              class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              rows="2"
            />
          </div>

          <button
            class="w-full px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={props.onContinue}
            disabled={!props.stepData.itemDescription}
          >
            Completar Factura ✓
          </button>
        </div>
      </Show>
    </div>
  );
}