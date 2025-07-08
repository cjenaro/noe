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

function LineItemComponent({ line }: { line: LineItem }) {
  return (
    <div class="mb-4 p-3 bg-white border border-gray-200 rounded">
      <div class="mb-2">
        <h5 class="text-xs font-medium text-gray-600">
          Línea {line.lineNumber}
        </h5>
      </div>

      <div class="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Código del Item
          </label>
          <input
            type="text"
            name={`itemCode_${line.lineNumber}`}
            value={line.itemCode}
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
            name={`quantity_${line.lineNumber}`}
            value={line.quantity}
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
          name={`itemDescription_${line.lineNumber}`}
          value={line.itemDescription}
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
            name={`unitPrice_${line.lineNumber}`}
            value={line.unitPrice}
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
            name={`bonusAmount_${line.lineNumber}`}
            value={line.bonusAmount}
            placeholder="0.00"
            class="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>
    </div>
  );
}

export function StepFour(props: StepFourProps) {
  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!e.currentTarget || !(e.currentTarget instanceof HTMLFormElement))
      return;
    const formData = new FormData(e.currentTarget);

    const updatedLineItems: LineItem[] = props.stepData.lineItems.map(
      (item) => ({
        lineNumber: item.lineNumber,
        itemCode: (formData.get(`itemCode_${item.lineNumber}`) as string) || "",
        itemDescription:
          (formData.get(`itemDescription_${item.lineNumber}`) as string) || "",
        quantity: (formData.get(`quantity_${item.lineNumber}`) as string) || "",
        unitOfMeasure: item.unitOfMeasure,
        unitPrice:
          (formData.get(`unitPrice_${item.lineNumber}`) as string) || "",
        bonusAmount:
          (formData.get(`bonusAmount_${item.lineNumber}`) as string) || "",
      }),
    );

    const otherData = (formData.get("otherData") as string) || "";

    props.onFieldChange("lineItems", updatedLineItems);
    props.onFieldChange("otherData", otherData);
    props.onContinue();
  }

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
        <form
          onSubmit={handleSubmit}
          class="p-3 bg-purple-50 border-t border-purple-200"
          id="line-items-form"
        >
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
              {(item) => <LineItemComponent line={item} />}
            </For>
          </div>

          <div class="mb-3">
            <label class="block text-xs font-medium text-gray-700 mb-2">
              Otros Datos
            </label>
            <textarea
              name="otherData"
              value={props.stepData.otherData}
              placeholder="Información adicional..."
              class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              rows="2"
            />
          </div>

          <button
            type="submit"
            class="w-full px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Completar Factura ✓
          </button>
        </form>
      </Show>
    </div>
  );
}
