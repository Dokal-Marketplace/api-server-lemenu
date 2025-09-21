// Define los tipos de ubicación
export interface District {
  name: string;
}

export interface Province {
  name: string;
  districts: District[];
}

export interface Region {
  name: string;
  provinces: Province[];
}

// También puedes definir tipos para los selectores
export interface LocationSelection {
  region: string;
  province: string;
  district: string;
}
