"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  createContext,
  JSX,
  useContext,
  useEffect,
  useMemo,
} from "react";

import { produce } from "immer";
import { Container } from "inversify";
import {
  createStore,
  type StoreApi,
  useStore as useZustandStore,
} from "zustand";

interface ICtx {
  container: ContextValue;
  Context: React.Context<ContextValue>;
}
// 提供钩子，全局使用
export const { onCreated, emitCreated, clearCreated } = (() => {
  const list: ((ctx: ICtx) => void)[] = [];

  function register(callback: (ctx: ICtx) => void) {
    list.push(callback);
  }
  return {
    onCreated: register,
    emitCreated(ctx: ICtx) {
      list.forEach((callback) => callback(ctx));
    },
    clearCreated() {
      list.length = 0;
    },
  };
})();

function isHook(value: unknown) {
  return (
    typeof value === "function" &&
    (value as unknown as { $isHook?: boolean }).$isHook
  );
}
// 是否是废弃的 store
function isDeprecatedStore(value: unknown) {
  return (
    typeof value === "function" &&
    (value as unknown as { $deprecatedStore?: boolean }).$deprecatedStore
  );
}

export function mutateState<T>(
  set: (obj: Partial<T>) => void,
  get: () => T,
  updater: (state: T) => void
) {
  set(produce(get(), updater));
}

interface ContextValue {
  services: Container;
  stores: Record<string, StoreApi<unknown>>;
  hooksStore: StoreApi<Record<string, unknown>>;
}
export function createViewless<
  S extends Record<
    string,
    | ((set: (obj: any) => void, get: () => any) => any)
    | ((...args: any[]) => any)
  >,
  T extends Record<string, new (...arg: any[]) => unknown>
>(stores: S, services: T) {
  // 是否在Provider内使用
  let providerReady = false;
  const hooksDefinition: Record<string, (...args: any[]) => any> = {};
  Object.entries(stores).forEach(([key, value]) => {
    // hook逻辑
    if (isHook(value)) {
      hooksDefinition[key] = value;
      return;
    }
  });

  const Context = createContext<ContextValue>({
    stores: {},
    hooksStore: {},
  } as ContextValue);

  type StoresRes = {
    [Key in keyof S]: ReturnType<S[Key]>;
  };
  type ServicesRes = {
    [Key in keyof T]: InstanceType<T[Key]>;
  };
  type StoresAndServicesRes = StoresRes & ServicesRes;

  /**
   * 通过hook注册store
   * 必须在某个地方调用才会有store
   */
  function useHook<
    K extends keyof S,
    M = ReturnType<S[K]>,
    N extends Parameters<S[K]> = Parameters<S[K]>
  >(name: K, params: N): M {
    const context = useContext(Context);
    const useHookDefinition = hooksDefinition[name as string];
    const res = useHookDefinition(...params);
    useEffect(() => {
      // 将hook的返回值保存到hooksValue中, 方便在service中消费
      context.hooksStore.setState({
        [name as string]: res,
      });
    }, [name, res]);

    return res;
  }

  function UseHook<
    K extends keyof S,
    N extends Parameters<S[K]> = Parameters<S[K]>
  >(props: { name: K; params: N }) {
    const { name, params } = props;
    useHook(name, params);
    return null;
  }

  /**
   * 自动执行注册的hook，方便hooks返回值在viewless系统内流动
   */
  function AutoRunHook() {
    const res = Object.entries(hooksDefinition).map(([key, value]) => {
      const hookParams = (value as unknown as { $hookParams?: any })
        ?.$hookParams;
      return hookParams ? (
        <UseHook key={key} name={key} params={hookParams} />
      ) : null;
    }) as JSX.Element[];
    return <>{res}</>;
  }
  /**
   * 项目入口注入Provider组件
   */
  function Provider({
    parent,
    children,
    containerCreated,
  }: {
    parent?: Container;
    children: unknown;
    containerCreated?: (container: Container) => void;
  }) {
    const contextValue = useMemo(() => {
      const container = new Container({
        defaultScope: "Singleton",
      });
      if (parent) {
        container.parent = parent;
      }
      containerCreated?.(container);
      const storesValue: Record<string, StoreApi<unknown>> = {};
      Object.entries(stores).forEach(([key, value]) => {
        if (isHook(value)) {
          return;
        }
        if (isDeprecatedStore(value)) {
          storesValue[key] = (value as () => StoreApi<unknown>)();
          container.bind(key).toConstantValue(storesValue[key]);
          return;
        }

        const store = createStore(value);
        storesValue[key] = store;
        // 代理，在services层中方便消费
        container.bind(key).toConstantValue(
          new Proxy(
            {},
            {
              get(target, prop) {
                return store.getState()[prop as keyof StoreApi<unknown>];
              },
            }
          )
        );
      });
      // 为hooks创建一个store
      const hooksStore = createStore<Record<string, unknown>>(
        (set, get) => ({})
      );
      Object.entries(hooksDefinition).forEach(([key, value]) => {
        container.bind(key).toConstantValue(
          new Proxy(value, {
            get(target, prop) {
              return (
                hooksStore.getState()[key as string] as Record<string, unknown>
              )?.[prop as string];
            },
          })
        );
      });

      Object.entries(services).forEach(([key, value]) => {
        container.bind(key).to(value);
      });

      const result = {
        services: container,
        stores: storesValue,
        hooksStore,
      };

      emitCreated({
        container: result,
        Context,
      });
      providerReady = true;
      return result;
    }, []);

    return (
      <Context.Provider value={contextValue}>
        <AutoRunHook />
        {children as React.ReactNode}
      </Context.Provider>
    );
  }

  // function useStore<K extends keyof S>(name: K): ReturnType<S[K]> {

  // ------- 使用单个store/service，提高性能 -------
  function useStore<K extends keyof S, M = ReturnType<S[K]>>(
    name: K,
    selector?: (store: ReturnType<S[K]>) => M
  ): M {
    const context = useContext(Context);
    return useZustandStore(
      context.stores[name as string],
      selector as any
    ) as ReturnType<S[K]>;
  }

  function useService<K extends keyof T>(name: K): InstanceType<T[K]> {
    const context = useContext(Context);
    return context.services.get(name as string);
  }

  // 兼容之前的，不推荐使用
  function useServices(): ServicesRes {
    const context = useContext(Context);
    return new Proxy(
      {},
      {
        get(target, key) {
          return context.services.get(key as string);
        },
      }
    ) as ServicesRes;
  }

  // ------- 代理store和service -------
  // 使用stores和services, 不能重名
  function useViewless(): StoresAndServicesRes {
    const context = useContext(Context);

    const res = new Proxy(
      {},
      {
        get(target, key) {
          const storeInstance = context.stores[key as string];
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const store = useZustandStore(
            storeInstance || {
              getState() {
                return null;
              },
              setState() {
                // empty
              },
              subscribe: () => () => {
                // empty
              },
              getInitialState() {
                return null;
              },
            }
          );

          // eslint-disable-next-line react-hooks/rules-of-hooks
          const hookRes = useZustandStore(
            context.hooksStore,
            (state) => state[key as string]
          );

          if (context.stores[key as string]) {
            return store;
          }
          if (key in hooksDefinition) {
            return hookRes;
          }
          // 返回代理，绑定this
          return new Proxy(
            {},
            {
              get(_, prop) {
                const service = context.services.get(key as string) as Record<
                  string,
                  unknown
                >;
                if (!service) {
                  return service;
                }
                const value = service[prop as string];
                if (typeof value === "function") {
                  return value.bind(service);
                }
                return value;
              },
            }
          );
        },
      }
    ) as StoresAndServicesRes;
    if (!providerReady) {
      throw new Error(
        "Please make sure to use useViewless in the children of the Provider."
      );
    }
    return res;
  }

  // view组件，真正实现viewless
  function View({
    children,
    onMounted,
  }: {
    children: (res: StoresAndServicesRes) => unknown;
    onMounted?: (res: StoresAndServicesRes) => void;
  }): JSX.Element {
    const context = useContext(Context);
    const res = useViewless();
    useEffect(() => {
      onMounted?.(
        new Proxy(
          {},
          {
            get(target, key) {
              return context.services.get(key as string);
            },
          }
        ) as StoresAndServicesRes
      );
    }, []);
    return <>{children(res)}</>;
  }

  return {
    useZustandStore,
    Context,
    Provider,
    useHook,
    useStore,
    useService,
    useServices,
    useViewless,
    View,
    UseHook,
  };
}
