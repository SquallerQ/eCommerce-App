// useCookieManager.test.tsx
import { renderHook } from "@testing-library/react";
import { useCookies } from "react-cookie";
import { useCookieManager } from "../hooks/useCookieManager";

jest.mock("react-cookie");

describe("useCookieManager", () => {
  const mockSetCookie = jest.fn();
  const mockRemoveCookie = jest.fn();
  const mockCookies = { testCookie: "test-value" };

  beforeEach(() => {
    (useCookies as jest.Mock).mockReturnValue([mockCookies, mockSetCookie, mockRemoveCookie]);
    jest.clearAllMocks();
  });

  it("should return current cookies", () => {
    const { result } = renderHook(() => useCookieManager());
    expect(result.current.cookies).toEqual(mockCookies);
  });

  describe("setCookie", () => {
    it("should call setCookie with correct params", () => {
      const { result } = renderHook(() => useCookieManager());
      result.current.setCookie("newCookie", "value");

      expect(mockSetCookie).toHaveBeenCalledWith("newCookie", "value", { path: "/" });
    });
  });

  describe("removeCookie", () => {
    it("should call removeCookie with correct params", () => {
      const { result } = renderHook(() => useCookieManager());
      result.current.removeCookie("testCookie");

      expect(mockRemoveCookie).toHaveBeenCalledWith("testCookie", { path: "/" });
    });
  });
});
