/// <reference types="vite/client" />

declare global {
  interface Window {
    AMap: AMapType;
    initAMap: () => void;
    _AMapSecurityConfig?: {
      securityJsCode: string;
    };
  }
  
  interface AMapType {
    Map: {
      new (container: HTMLElement, opts?: MapOptions): AMapInstance;
    };
    Geocoder: {
      new (opts?: any): GeocoderInstance;
    };
    Marker: {
      new (opts?: MarkerOptions): MarkerInstance;
    };
    InfoWindow: {
      new (opts?: InfoWindowOptions): InfoWindowInstance;
    };
    ToolBar: {
      new (opts?: any): any;
    };
    Scale: {
      new (opts?: any): any;
    };
    MapType: {
      new (opts?: any): any;
    };
    Pixel: {
      new (x: number, y: number): any;
    };
    plugin: (plugins: string[], callback: () => void) => void;
  }
  
  interface MapOptions {
    zoom?: number;
    center?: [number, number];
    viewMode?: '2D' | '3D';
    layers?: any[];
  }
  
  interface AMapInstance {
    setCenter: (position: [number, number]) => void;
    add: (overlay: any) => void;
    remove: (overlay: any) => void;
    destroy: () => void;
    resize: () => void;
    setZoom: (zoom: number) => void;
    getCenter: () => [number, number];
    on: (event: string, handler: (e: any) => void) => void;
    off: (event: string, handler?: (e: any) => void) => void;
  }
  
  interface GeocoderInstance {
    getLocation: (address: string, callback: (status: string, result: GeocoderResult) => void) => void;
  }
  
  interface GeocoderResult {
    geocodes: Geocode[];
  }
  
  interface Geocode {
    location: {
      lng: number;
      lat: number;
    };
    formattedAddress: string;
    country: string;
    province: string;
    city: string;
    district: string;
    township?: string;
    street?: string;
    number?: string;
  }
  
  interface MarkerOptions {
    position?: [number, number];
    title?: string;
    icon?: any;
    offset?: any;
    content?: HTMLElement | string;
  }
  
  interface MarkerInstance {
    on: (event: string, handler: (e: any) => void) => void;
    off: (event: string, handler?: (e: any) => void) => void;
    setPosition: (position: [number, number]) => void;
    getPosition: () => [number, number];
    setTitle: (title: string) => void;
  }
  
  interface InfoWindowOptions {
    content?: string | HTMLElement;
    offset?: any;
    size?: any;
    autoMove?: boolean;
    isCustom?: boolean;
  }
  
  interface InfoWindowInstance {
    open: (map: AMapInstance, position: [number, number]) => void;
    close: () => void;
    setContent: (content: string | HTMLElement) => void;
  }
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_AMAP_API_KEY?: string;
  readonly VITE_AMAP_SECURITY_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}