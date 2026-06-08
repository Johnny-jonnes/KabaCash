declare module 'next-pwa' {
  import { NextConfig } from 'next';
  
  interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    runtimeCaching?: any[];
    buildExcludes?: string[];
    [key: string]: any;
  }
  
  function withPWAInit(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;
  
  export default withPWAInit;
}
