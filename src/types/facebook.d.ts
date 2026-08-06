export {};

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: {
      init: (params: {
        appId: string;
        autoLogAppEvents?: boolean;
        xfbml?: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: any) => void,
        params: {
          config_id?: string;
          response_type?: string;
          override_default_response_type?: boolean;
          extras?: {
            setup?: any;
            sessionInfoVersion?: string;
            featureType?: string;
          };
          scope?: string;
        }
      ) => void;
      getLoginStatus: (callback: (response: any) => void) => void;
    };
  }
}
