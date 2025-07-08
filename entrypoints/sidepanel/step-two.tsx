import { Show } from "solid-js";
import { IdiomaAutocomplete, ConceptoAutocomplete, ActividadAutocomplete, MonedaAutocomplete } from "./autocompletes";

interface StepTwoProps {
  isCollapsed: boolean;
  stepData: {
    idioma: string;
    concepto: string;
    actividad: string;
    fechaComprobante: string;
    monedaExtranjera: boolean;
    selectedMoneda: string;
  };
  onFieldChange: (key: keyof StepTwoProps["stepData"], value: string | boolean) => void;
  onContinue: () => void;
}

export function StepTwo(props: StepTwoProps) {
  return (
    <div class="mb-4 border border-orange-200 rounded-md overflow-hidden">
      <div
        class={`p-3 cursor-pointer transition-colors ${props.isCollapsed ? "bg-green-100 border-green-200" : "bg-orange-50"}`}
      >
        <h3
          class={`text-sm font-medium flex items-center justify-between ${props.isCollapsed ? "text-green-900" : "text-orange-900"}`}
        >
          <span>
            {props.isCollapsed
              ? "✅ Paso 2: Completado"
              : "⚙️ Paso 2: Configuración de Factura"}
          </span>
          <span class="text-xs">{props.isCollapsed ? "▲" : "▼"}</span>
        </h3>
      </div>

      <Show when={!props.isCollapsed}>
        <div class="p-3 bg-orange-50 border-t border-orange-200">
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-2">
                Idioma
              </label>
              <IdiomaAutocomplete
                value={props.stepData.idioma}
                onChange={(value) => props.onFieldChange("idioma", value)}
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-2">
                Fecha (DD/MM/YYYY)
              </label>
              <input
                type="text"
                value={props.stepData.fechaComprobante}
                onInput={(e) =>
                  props.onFieldChange(
                    "fechaComprobante",
                    e.currentTarget.value,
                  )
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
            <ConceptoAutocomplete
              value={props.stepData.concepto}
              onChange={(value) => props.onFieldChange("concepto", value)}
            />
          </div>

          <div class="mb-3">
            <label class="block text-xs font-medium text-gray-700 mb-2">
              Actividad
            </label>
            <ActividadAutocomplete
              value={props.stepData.actividad}
              onChange={(v) => props.onFieldChange("actividad", v)}
            />
          </div>

          <div class="mb-3">
            <label class="flex items-center text-xs font-medium text-gray-700">
              <input
                type="checkbox"
                checked={props.stepData.monedaExtranjera}
                onChange={(e) =>
                  props.onFieldChange("monedaExtranjera", e.target.checked)
                }
                class="mr-2"
              />
              Moneda Extranjera
            </label>
          </div>

          <Show when={props.stepData.monedaExtranjera}>
            <div class="mb-3">
              <label class="block text-xs font-medium text-gray-700 mb-2">
                Moneda
              </label>
              <MonedaAutocomplete
                value={props.stepData.selectedMoneda}
                onChange={(value) =>
                  props.onFieldChange("selectedMoneda", value)
                }
              />
            </div>
          </Show>

          <button
            class="w-full px-3 py-2 bg-orange-600 text-white text-sm font-medium rounded hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={props.onContinue}
            disabled={!props.stepData.concepto}
          >
            Continuar al Paso 3 →
          </button>
        </div>
      </Show>
    </div>
  );
}