import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useContext, useMemo } from 'react';

import { AlertsContext } from '~/contexts/alerts';

export const Alerts: React.FC = () => {
  const alertsContext = useContext(AlertsContext);

  const removeAlertFns = useMemo<(() => void)[]>(() => {
    const removalFns: (() => void)[] = alertsContext.alerts.map((_, index) => {
      return () => {
        alertsContext.removeAlert(index);
      };
    });
    return removalFns;
  }, [alertsContext]);

  if (alertsContext.alerts.length > 0) {
    const alertElements = alertsContext.alerts.map((alert, index) => {
      const classNameParts: string[] = [
        'flex',
        'grow',
        'flex-row',
        'justify-center',
        'p-2',
      ];
      switch (alert.type) {
        case 'error': {
          classNameParts.push('bg-red-500');
          classNameParts.push('text-white');
          break;
        }
        case 'warning': {
          classNameParts.push('bg-yellow-500');
          classNameParts.push('text-white');
          break;
        }
        case 'info': {
          classNameParts.push('bg-blue-500');
          classNameParts.push('text-white');
          break;
        }
        case 'success': {
          classNameParts.push('bg-green-500');
          classNameParts.push('text-white');
          break;
        }
        default: {
          throw new Error('unknown alert type');
        }
      }

      return (
        <div
          key={`alertElements-${index}`}
          className={classNameParts.join(' ')}
        >
          <div className="text-center">{alert.message}</div>
          <button className="ml-8" onClick={removeAlertFns[index]}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      );
    });

    return <div className="flex-column flex max-w-full">{alertElements}</div>;
  } else {
    return null;
  }
};
