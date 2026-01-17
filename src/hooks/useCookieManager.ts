import { useCookies } from "react-cookie";

type CookieOptions = Parameters<ReturnType<typeof useCookies>[1]>[1];

export function useCookieManager() {
  const [cookies, setCookie, removeCookie] = useCookies();

  const set = (name: string, value: string, options?: CookieOptions) => {
    setCookie(name, value, { path: "/", ...options });
  };

  const remove = (name: string, options?: CookieOptions) => {
    removeCookie(name, { path: "/", ...options });
  };

  return { cookies, setCookie: set, removeCookie: remove };
}
