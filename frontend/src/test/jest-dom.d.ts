import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      // DOM Element Matchers
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toBeEmpty(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeInvalid(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toContainElement(element: Element | null): R;
      toContainHTML(html: string): R;
      toHaveAttribute(attr: string, value?: string | RegExp): R;
      toHaveClass(...classNames: string[]): R;
      toHaveFocus(): R;
      toHaveFormValues(expectedValues: { [key: string]: any }): R;
      toHaveStyle(css: string | object): R;
      toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): R;
      toHaveValue(value?: string | string[] | number): R;
      toBeChecked(): R;
      toBePartiallyChecked(): R;
      toHaveDescription(text: string | RegExp): R;
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R;
      toBeEmptyDOMElement(): R;
      toHaveAccessibleDescription(text?: string | RegExp): R;
      toHaveAccessibleName(text?: string | RegExp): R;
      toHaveErrorMessage(text?: string | RegExp): R;

      // Custom Matchers for Technical Indicators
      toHaveIndicatorResults(): R;
      toHaveValidOverlayData(): R;
      toMatchIndicatorSettings(settings: object): R;
      toHaveActiveIndicator(name: string): R;
      toHaveIndicatorParameters(params: object): R;
      toHaveIndicatorStyle(style: object): R;
      toHaveCalculatedValues(length: number): R;
      toHaveValidBreakoutPoints(): R;
      toHaveValidSupportResistanceLevels(): R;
      toHaveValidTrendlines(): R;
      toHaveValidPivotPoints(): R;
      toHaveValidFibonacciLevels(): R;
      toHaveValidMovingAverages(): R;
      toHaveValidOscillatorValues(): R;
      toHaveValidVolatilityBands(): R;
      toHaveValidMomentumIndicators(): R;
      toHaveValidVolumeProfile(): R;

      // Chart-specific Matchers
      toHaveChartData(): R;
      toHaveValidTimeframe(): R;
      toHaveValidPriceScale(): R;
      toHaveValidDateRange(): R;
      toHaveChartOverlay(overlayType: string): R;
      toHaveValidLegend(): R;
      toHaveValidTooltip(): R;
      toHaveValidCrosshair(): R;
      toHaveValidZoomLevel(): R;
      toHaveValidPanning(): R;

      // WebSocket Matchers
      toHaveWebSocketConnection(): R;
      toHaveReceivedWebSocketMessage(type: string): R;
      toHaveValidSubscription(channel: string): R;
      toHaveValidHeartbeat(): R;
      toHaveReconnectionAttempts(): R;

      // Risk Analysis Matchers
      toHaveValidRiskMetrics(): R;
      toHaveValidPortfolioStats(): R;
      toHaveValidCorrelationMatrix(): R;
      toHaveValidDrawdownAnalysis(): R;
      toHaveValidSharpeRatio(): R;
      toHaveValidVolatilityMeasures(): R;
      toHaveValidBetaCalculation(): R;
      toHaveValidVaRCalculation(): R;

      // Trading System Matchers
      toHaveValidOrderBook(): R;
      toHaveValidPositions(): R;
      toHaveValidTrades(): R;
      toHaveValidBalances(): R;
      toHaveValidMarginRequirements(): R;
      toHaveValidLeverageSettings(): R;
      toHaveValidStopLoss(): R;
      toHaveValidTakeProfit(): R;

      // Blockchain Integration Matchers
      toHaveValidWalletConnection(): R;
      toHaveValidTokenBalance(): R;
      toHaveValidTransactionHistory(): R;
      toHaveValidSmartContractInteraction(): R;
      toHaveValidTokenAllowance(): R;
      toHaveValidNetworkStatus(): R;
      toHaveValidGasEstimates(): R;

      // Authentication Matchers
      toHaveValidSession(): R;
      toHaveValidToken(): R;
      toHaveValidPermissions(): R;
      toHaveValid2FASetup(): R;
      toHaveValidBackupCodes(): R;
      toHaveValidEmailVerification(): R;
    }
  }
}