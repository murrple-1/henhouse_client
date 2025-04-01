import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useRef,
  useState,
} from 'react';

export interface AlertRemovalInfo {
  id: string;
  timeout?: number;
}

export interface Alert {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  removalInfo?: AlertRemovalInfo;
}

export interface AlertsContextType {
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  removeAlert: (index: number) => void;
}

export const AlertsContext = createContext<AlertsContextType>({
  alerts: [],
  addAlert: () => {},
  removeAlert: () => {},
});

export const AlertsContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const alertTimeouts = useRef<Record<string, number>>({});

  const addAlert = useCallback(
    (alert: Alert) => {
      let alerts_ = [...alerts];

      const removalInfo = alert.removalInfo;
      if (removalInfo !== undefined) {
        alerts_ = [
          ...alerts_.filter(a => {
            if (a.removalInfo !== undefined) {
              return a.removalInfo.id !== removalInfo.id;
            }
            return true;
          }),
          alert,
        ];

        if (removalInfo.timeout !== undefined) {
          if (alertTimeouts.current[removalInfo.id] !== undefined) {
            window.clearTimeout(alertTimeouts.current[removalInfo.id]);
            delete alertTimeouts.current[removalInfo.id];
          }

          alertTimeouts.current[removalInfo.id] = window.setTimeout(() => {
            setAlerts(
              alerts_.filter(a => {
                if (a.removalInfo !== undefined) {
                  return a.removalInfo.id !== removalInfo.id;
                }
                return true;
              }),
            );
            delete alertTimeouts.current[removalInfo.id];
          }, removalInfo.timeout);
        }
      } else {
        alerts_.push(alert);
      }

      setAlerts(alerts_);
    },
    [alerts, setAlerts],
  );

  const removeAlert = useCallback(
    (index: number) => {
      setAlerts(alerts.filter((_, i) => i !== index));
    },
    [alerts, setAlerts],
  );

  return (
    <AlertsContext.Provider
      value={{
        alerts,
        addAlert,
        removeAlert,
      }}
    >
      {children}
    </AlertsContext.Provider>
  );
};
