import { Show } from "solid-js";
import { PuntoVentaAutocomplete, TipoComprobanteAutocomplete } from "./autocompletes";

interface StepOneProps {
  isCollapsed: boolean;
  stepData: {
    puntoVenta: string;
    tipoComprobante: string;
  };
  onFieldChange: (key: "puntoVenta" | "tipoComprobante", value: string) => void;
  onContinue: () => void;
}

export function StepOne(props: StepOneProps) {
  return (
    <div class="mb-4 border border-blue-200 rounded-md overflow-hidden">
      <div
        class={`p-3 cursor-pointer transition-colors ${props.isCollapsed ? "bg-green-100 border-green-200" : "bg-blue-50"}`}
      >
        <h3
          class={`text-sm font-medium flex items-center justify-between ${props.isCollapsed ? "text-green-900" : "text-blue-900"}`}
        >
          <span>
            {props.isCollapsed
              ? "✅ Paso 1: Completado"
              : "📋 Paso 1: Configuración AFIP"}
          </span>
          <span class="text-xs">{props.isCollapsed ? "▲" : "▼"}</span>
        </h3>
      </div>

      <Show when={!props.isCollapsed}>
        <div class="p-3 bg-blue-50 border-t border-blue-200">
          <div class="mb-3">
            <label class="block text-xs font-medium text-gray-700 mb-2">
              Punto de Venta *
            </label>
            <PuntoVentaAutocomplete
              value={props.stepData.puntoVenta}
              onChange={(value) => props.onFieldChange("puntoVenta", value)}
            />
          </div>

          <div class="mb-3">
            <label class="block text-xs font-medium text-gray-700 mb-2">
              Tipo de Comprobante *
            </label>
            <TipoComprobanteAutocomplete
              value={props.stepData.tipoComprobante}
              onChange={(value) =>
                props.onFieldChange("tipoComprobante", value)
              }
              puntoVentaValue={props.stepData.puntoVenta}
            />
          </div>

          <button
            class="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={props.onContinue}
            disabled={
              !props.stepData.puntoVenta || !props.stepData.tipoComprobante
            }
          >
            Continuar al Paso 2 →
          </button>
        </div>
      </Show>
    </div>
  );
}