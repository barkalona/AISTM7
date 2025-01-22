import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from typing import List, Dict, Tuple, Optional
import joblib
import os

class AIService:
    def __init__(self, model_path: str = 'models'):
        """
        Initialize AI service with model storage path.
        
        Args:
            model_path: Directory to store trained models
        """
        self.model_path = model_path
        self.scaler = MinMaxScaler()
        os.makedirs(model_path, exist_ok=True)

    def prepare_sequence_data(
        self,
        data: pd.DataFrame,
        sequence_length: int = 60,
        target_column: str = 'close'
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare sequential data for LSTM model.
        
        Args:
            data: DataFrame with price data
            sequence_length: Number of time steps to look back
            target_column: Column name for target variable
            
        Returns:
            Tuple of (X, y) arrays for training
        """
        scaled_data = self.scaler.fit_transform(data[[target_column]])
        X, y = [], []
        
        for i in range(sequence_length, len(scaled_data)):
            X.append(scaled_data[i-sequence_length:i])
            y.append(scaled_data[i])
            
        return np.array(X), np.array(y)

    def build_lstm_model(
        self,
        sequence_length: int,
        n_features: int,
        units: List[int] = [50, 50],
        dropout: float = 0.2
    ) -> Sequential:
        """
        Build LSTM model for time series prediction.
        
        Args:
            sequence_length: Length of input sequences
            n_features: Number of input features
            units: List of units in each LSTM layer
            dropout: Dropout rate
            
        Returns:
            Compiled Keras model
        """
        model = Sequential()
        
        # First LSTM layer
        model.add(LSTM(
            units[0],
            return_sequences=len(units) > 1,
            input_shape=(sequence_length, n_features)
        ))
        model.add(Dropout(dropout))
        
        # Additional LSTM layers
        for i in range(1, len(units)):
            model.add(LSTM(
                units[i],
                return_sequences=i < len(units) - 1
            ))
            model.add(Dropout(dropout))
        
        # Output layer
        model.add(Dense(1))
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='mse'
        )
        
        return model

    def train_prediction_model(
        self,
        historical_data: pd.DataFrame,
        symbol: str,
        sequence_length: int = 60,
        epochs: int = 50,
        batch_size: int = 32
    ) -> Dict:
        """
        Train prediction model for a specific symbol.
        
        Args:
            historical_data: DataFrame with historical price data
            symbol: Trading symbol
            sequence_length: Number of time steps to look back
            epochs: Number of training epochs
            batch_size: Training batch size
            
        Returns:
            Dictionary with training metrics
        """
        X, y = self.prepare_sequence_data(historical_data, sequence_length)
        
        # Split data
        train_size = int(len(X) * 0.8)
        X_train, X_test = X[:train_size], X[train_size:]
        y_train, y_test = y[:train_size], y[train_size:]
        
        # Build and train model
        model = self.build_lstm_model(sequence_length, X.shape[-1])
        history = model.fit(
            X_train, y_train,
            epochs=epochs,
            batch_size=batch_size,
            validation_data=(X_test, y_test),
            verbose=0
        )
        
        # Save model
        model.save(os.path.join(self.model_path, f'{symbol}_prediction.h5'))
        
        return {
            'training_loss': history.history['loss'][-1],
            'validation_loss': history.history['val_loss'][-1]
        }

    def detect_anomalies(
        self,
        data: pd.DataFrame,
        contamination: float = 0.1
    ) -> np.ndarray:
        """
        Detect anomalies in price movements.
        
        Args:
            data: DataFrame with price data
            contamination: Expected proportion of outliers
            
        Returns:
            Array of boolean values (True for anomalies)
        """
        iso_forest = IsolationForest(
            contamination=contamination,
            random_state=42
        )
        
        # Prepare features
        features = pd.DataFrame({
            'returns': data['close'].pct_change(),
            'volume_change': data['volume'].pct_change(),
            'price_range': (data['high'] - data['low']) / data['close']
        }).fillna(0)
        
        # Fit and predict
        anomalies = iso_forest.fit_predict(features)
        return anomalies == -1  # -1 indicates anomaly

    def analyze_market_sentiment(
        self,
        price_data: pd.DataFrame,
        volume_data: Optional[pd.DataFrame] = None,
        window_size: int = 14
    ) -> Dict[str, float]:
        """
        Analyze market sentiment using technical indicators.
        
        Args:
            price_data: DataFrame with price data
            volume_data: Optional DataFrame with volume data
            window_size: Window size for indicators
            
        Returns:
            Dictionary with sentiment metrics
        """
        # Calculate technical indicators
        rsi = self._calculate_rsi(price_data['close'], window_size)
        macd = self._calculate_macd(price_data['close'])
        
        # Volume trend if available
        volume_trend = 0
        if volume_data is not None:
            volume_sma = volume_data['volume'].rolling(window_size).mean()
            volume_trend = 1 if volume_data['volume'].iloc[-1] > volume_sma.iloc[-1] else -1
        
        # Combine indicators into sentiment score
        sentiment_score = (
            self._normalize_indicator(rsi.iloc[-1], 0, 100) +
            self._normalize_indicator(macd['macd'].iloc[-1], macd['macd'].min(), macd['macd'].max()) +
            volume_trend
        ) / 3
        
        return {
            'sentiment_score': sentiment_score,
            'rsi': rsi.iloc[-1],
            'macd': macd['macd'].iloc[-1],
            'volume_trend': volume_trend
        }

    def _calculate_rsi(self, prices: pd.Series, window: int = 14) -> pd.Series:
        """Calculate Relative Strength Index."""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))

    def _calculate_macd(
        self,
        prices: pd.Series,
        fast: int = 12,
        slow: int = 26,
        signal: int = 9
    ) -> pd.DataFrame:
        """Calculate MACD indicator."""
        exp1 = prices.ewm(span=fast, adjust=False).mean()
        exp2 = prices.ewm(span=slow, adjust=False).mean()
        macd = exp1 - exp2
        signal_line = macd.ewm(span=signal, adjust=False).mean()
        
        return pd.DataFrame({
            'macd': macd,
            'signal': signal_line,
            'histogram': macd - signal_line
        })

    def _normalize_indicator(
        self,
        value: float,
        min_val: float,
        max_val: float
    ) -> float:
        """Normalize indicator to [-1, 1] range."""
        return 2 * ((value - min_val) / (max_val - min_val)) - 1

    def predict_price_movement(
        self,
        symbol: str,
        current_data: pd.DataFrame,
        sequence_length: int = 60
    ) -> Dict[str, float]:
        """
        Predict future price movement for a symbol.
        
        Args:
            symbol: Trading symbol
            current_data: Recent price data
            sequence_length: Number of time steps to look back
            
        Returns:
            Dictionary with prediction metrics
        """
        model_path = os.path.join(self.model_path, f'{symbol}_prediction.h5')
        if not os.path.exists(model_path):
            raise ValueError(f"No trained model found for {symbol}")
            
        # Prepare prediction data
        X = self.prepare_sequence_data(current_data[-sequence_length:], sequence_length)[0]
        
        # Load model and predict
        model = tf.keras.models.load_model(model_path)
        prediction = model.predict(X)
        
        # Calculate prediction metrics
        current_price = current_data['close'].iloc[-1]
        predicted_price = self.scaler.inverse_transform(prediction)[0][0]
        price_change = (predicted_price - current_price) / current_price * 100
        
        return {
            'current_price': current_price,
            'predicted_price': predicted_price,
            'predicted_change_percent': price_change,
            'prediction_confidence': self._calculate_prediction_confidence(model, X)
        }

    def _calculate_prediction_confidence(
        self,
        model: Sequential,
        X: np.ndarray,
        n_iterations: int = 100
    ) -> float:
        """
        Calculate prediction confidence using Monte Carlo Dropout.
        
        Args:
            model: Trained Keras model
            X: Input data
            n_iterations: Number of Monte Carlo iterations
            
        Returns:
            Confidence score between 0 and 1
        """
        predictions = []
        for _ in range(n_iterations):
            pred = model(X, training=True)  # Enable dropout during prediction
            predictions.append(pred.numpy())
            
        predictions = np.array(predictions)
        confidence = 1 - np.std(predictions) / np.mean(predictions)
        return max(0, min(1, confidence))  # Clip to [0, 1] range