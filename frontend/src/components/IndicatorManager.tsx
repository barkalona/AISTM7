import React, { useState } from 'react';
import { UseIndicatorsReturn } from '../hooks/useIndicators';

interface IndicatorManagerProps {
  indicators: UseIndicatorsReturn;
}

export const IndicatorManager: React.FC<IndicatorManagerProps> = ({ indicators }) => {
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);

  const handleAddIndicator = (name: string) => {
    indicators.addIndicator(name);
    setSelectedIndicator(name);
  };

  const handleRemoveIndicator = (name: string) => {
    indicators.removeIndicator(name);
    if (selectedIndicator === name) {
      setSelectedIndicator(null);
    }
  };

  const handleUpdateSettings = (
    name: string,
    paramName: string,
    value: number | string
  ) => {
    indicators.updateIndicatorSettings(name, {
      params: {
        ...indicators.settings[name].params,
        [paramName]: value,
      },
    });
  };

  const handleUpdateStyle = (
    name: string,
    styleProp: string,
    value: string | number
  ) => {
    indicators.updateIndicatorSettings(name, {
      style: {
        ...indicators.settings[name].style,
        [styleProp]: value,
      },
    });
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 dark:text-white">
          Available Indicators
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {indicators.availableIndicators.map(({ name, description, isActive }) => (
            <div
              key={name}
              className="p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium dark:text-white">{name}</span>
                {isActive ? (
                  <button
                    onClick={() => handleRemoveIndicator(name)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={() => handleAddIndicator(name)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Add
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {indicators.activeIndicators.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2 dark:text-white">
            Active Indicators
          </h3>
          <div className="space-y-4">
            {indicators.activeIndicators.map(indicator => (
              <div
                key={indicator.name}
                className={`p-4 border rounded ${
                  selectedIndicator === indicator.name
                    ? 'border-blue-500'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() =>
                    setSelectedIndicator(
                      selectedIndicator === indicator.name ? null : indicator.name
                    )
                  }
                >
                  <span className="font-medium dark:text-white">
                    {indicator.name}
                  </span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleRemoveIndicator(indicator.name);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                {selectedIndicator === indicator.name && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 dark:text-white">
                        Parameters
                      </h4>
                      {indicators.getIndicatorParams(indicator.name).map(param => (
                        <div key={param.name} className="flex items-center mb-2">
                          <label className="w-1/3 text-sm dark:text-gray-300">
                            {param.name}:
                          </label>
                          {param.type === 'number' ? (
                            <input
                              type="number"
                              value={
                                indicators.settings[indicator.name].params[
                                  param.name
                                ]
                              }
                              min={param.min}
                              max={param.max}
                              step={param.step}
                              onChange={e =>
                                handleUpdateSettings(
                                  indicator.name,
                                  param.name,
                                  parseFloat(e.target.value)
                                )
                              }
                              className="w-2/3 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          ) : (
                            <select
                              value={
                                indicators.settings[indicator.name].params[
                                  param.name
                                ]
                              }
                              onChange={e =>
                                handleUpdateSettings(
                                  indicator.name,
                                  param.name,
                                  e.target.value
                                )
                              }
                              className="w-2/3 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                              {param.options?.map(option => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      ))}
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 dark:text-white">Style</h4>
                      <div className="flex items-center mb-2">
                        <label className="w-1/3 text-sm dark:text-gray-300">
                          Color:
                        </label>
                        <input
                          type="color"
                          value={indicators.settings[indicator.name].style.color}
                          onChange={e =>
                            handleUpdateStyle(
                              indicator.name,
                              'color',
                              e.target.value
                            )
                          }
                          className="w-2/3"
                        />
                      </div>
                      <div className="flex items-center mb-2">
                        <label className="w-1/3 text-sm dark:text-gray-300">
                          Line Width:
                        </label>
                        <input
                          type="number"
                          value={
                            indicators.settings[indicator.name].style.lineWidth
                          }
                          min={1}
                          max={5}
                          step={0.5}
                          onChange={e =>
                            handleUpdateStyle(
                              indicator.name,
                              'lineWidth',
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-2/3 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div className="flex items-center">
                        <label className="w-1/3 text-sm dark:text-gray-300">
                          Opacity:
                        </label>
                        <input
                          type="number"
                          value={indicators.settings[indicator.name].style.opacity}
                          min={0}
                          max={1}
                          step={0.1}
                          onChange={e =>
                            handleUpdateStyle(
                              indicator.name,
                              'opacity',
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-2/3 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};