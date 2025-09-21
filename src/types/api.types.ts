import { Region } from "./location.types";

// Define el tipo genérico de respuesta de API
export interface ApiResponse<T> {
  type: string;
  message: string;
  data: T;
}

// Define el tipo genérico de respuesta de API para regiones
export type RegionsApiResponse = ApiResponse<Region[]>;
