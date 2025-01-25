import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler, RobustScaler
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input, Attention, MultiHeadAttention, LayerNormalization, Concatenate
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from tensorflow.keras.regularizers import l1_l2
from typing import List, Dict, Tuple, Optional, Union
import joblib
import os
from datetime import datetime
import logging

class EnhancedAIService:
    def __init__(self, model_path: str = 'models'):
        """
        Initialize enhanced AI service with advanced model capabilities.
        
        Args:
            model_path: Directory to store trained models
        """
        self.model_path = model_path
        self.price_scaler = RobustScaler()  # More robust to outliers
        self.feature_scaler = MinMaxScaler()
        os.makedirs(model_path, exist_ok=True)
        
        # Configure logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)

    def prepare_advanced_features(
        self,
        data: pd.DataFrame,
        technical_indicators: bool = True,
        market_data: Optional[pd.DataFrame] = None
    ) -> pd.DataFrame:
        """
        Prepare advanced feature set including technical indicators
        and market context if available.
        
        Args:
            data: DataFrame with OHLCV data
            technical_indicators: Whether to include technical indicators
            market_data: Optional broader market data
            
        Returns:
            DataFrame with engineered features
        """
        features = pd.DataFrame(index=data.index)
        
        # Price and volume features
        features['returns'] = data['close'].pct_change()
        features['log_returns'] = np.log1p(data['close']).diff()
        features['volume_returns'] = data['volume'].pct_change()
        features['price_range'] = (data['high'] - data['low']) / data['close']
        
        if technical_indicators:
            # Momentum indicators
            features['rsi'] = self._calculate_rsi(data['close'])
            macd = self._calculate_macd(data['close'])
            features = pd.concat([features, macd], axis=1)
            
            # Volatility indicators
            features['atr'] = self._calculate_atr(data)
            features['bollinger_upper'], features['bollinger_lower'] = self._calculate_bollinger_bands(data['close'])
            
            # Volume indicators
            features['obv'] = self._calculate_obv(data)
            features['vwap'] = self._calculate_vwap(data)
        
        if market_data is not None:
            # Market context features
            features['market_correlation'] = self._calculate_rolling_correlation(
                data['returns'],
                market_data['returns']
            )
            features['relative_strength'] = data['returns'] - market_data['returns']
        
        # Clean and normalize
        features = features.replace([np.inf, -np.inf], np.nan)
        features = features.fillna(method='ffill').fillna(0)
        
        return features

    def build_advanced_model(
        self,
        sequence_length: int,
        n_features: int,
        lstm_units: List[int] = [128, 64],
        attention_heads: int = 4,
        dropout_rate: float = 0.3,
        recurrent_dropout: float = 0.2,
        l1_reg: float = 1e-5,
        l2_reg: float = 1e-4
    ) -> Model:
        """
        Build advanced model architecture with attention mechanism
        and regularization.
        
        Args:
            sequence_length: Length of input sequences
            n_features: Number of input features
            lstm_units: List of units in LSTM layers
            attention_heads: Number of attention heads
            dropout_rate: Dropout rate
            recurrent_dropout: Recurrent dropout rate
            l1_reg: L1 regularization factor
            l2_reg: L2 regularization factor
            
        Returns:
            Compiled Keras model
        """
        # Input layer
        inputs = Input(shape=(sequence_length, n_features))
        x = inputs
        
        # LSTM layers with residual connections
        for i, units in enumerate(lstm_units):
            lstm_out = LSTM(
                units,
                return_sequences=True,
                dropout=dropout_rate,
                recurrent_dropout=recurrent_dropout,
                kernel_regularizer=l1_l2(l1_reg, l2_reg)
            )(x)
            
            # Add attention after each LSTM layer
            attention_out = MultiHeadAttention(
                num_heads=attention_heads,
                key_dim=units // attention_heads
            )(lstm_out, lstm_out)
            
            # Add & Norm
            x = LayerNormalization()(attention_out + lstm_out)
        
        # Global attention
        global_attention = Attention()([x, x])
        
        # Combine global and local features
        combined = Concatenate()([
            global_attention,
            tf.reduce_mean(x, axis=1),  # Global average pooling
            x[:, -1, :]  # Last sequence step
        ])
        
        # Dense layers
        dense = Dense(
            64,
            activation='relu',
            kernel_regularizer=l1_l2(l1_reg, l2_reg)
        )(combined)
        dense = Dropout(dropout_rate)(dense)
        
        # Output layer
        outputs = Dense(1)(dense)
        
        # Create model
        model = Model(inputs=inputs, outputs=outputs)
        
        # Compile with advanced optimizer settings
        optimizer = Adam(
            learning_rate=0.001,
            beta_1=0.9,
            beta_2=0.999,
            epsilon=1e-07,
            amsgrad=True
        )
        
        model.compile(
            optimizer=optimizer,
            loss='huber',  # More robust to outliers
            metrics=['mae', 'mse']
        )
        
        return model

    def train_advanced_prediction_model(
        self,
        historical_data: pd.DataFrame,
        symbol: str,
        market_data: Optional[pd.DataFrame] = None,
        sequence_length: int = 60,
        epochs: int = 100,
        batch_size: int = 32,
        validation_split: float = 0.2
    ) -> Dict:
        """
        Train advanced prediction model with optimized training process.
        
        Args:
            historical_data: DataFrame with historical price data
            symbol: Trading symbol
            market_data: Optional market context data
            sequence_length: Number of time steps to look back
            epochs: Maximum number of training epochs
            batch_size: Training batch size
            validation_split: Validation data fraction
            
        Returns:
            Dictionary with training metrics and model info
        """
        self.logger.info(f"Starting advanced model training for {symbol}")
        
        # Prepare features
        features = self.prepare_advanced_features(
            historical_data,
            technical_indicators=True,
            market_data=market_data
        )
        
        # Prepare sequences
        X, y = self._prepare_sequence_data(
            features,
            historical_data['close'],
            sequence_length
        )
        
        # Split data
        split_idx = int(len(X) * (1 - validation_split))
        X_train, X_val = X[:split_idx], X[split_idx:]
        y_train, y_val = y[:split_idx], y[split_idx:]
        
        # Build model
        model = self.build_advanced_model(
            sequence_length,
            X.shape[-1]
        )
        
        # Callbacks for training optimization
        callbacks = [
            EarlyStopping(
                monitor='val_loss',
                patience=10,
                restore_best_weights=True
            ),
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=1e-6
            ),
            ModelCheckpoint(
                os.path.join(self.model_path, f'{symbol}_best.h5'),
                monitor='val_loss',
                save_best_only=True
            )
        ]
        
        # Train model
        history = model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks,
            verbose=1
        )
        
        # Save training artifacts
        model_info = {
            'symbol': symbol,
            'features': features.columns.tolist(),
            'sequence_length': sequence_length,
            'training_date': datetime.now().isoformat(),
            'training_samples': len(X_train),
            'final_train_loss': history.history['loss'][-1],
            'final_val_loss': history.history['val_loss'][-1],
            'best_val_loss': min(history.history['val_loss']),
            'training_epochs': len(history.history['loss'])
        }
        
        joblib.dump(
            model_info,
            os.path.join(self.model_path, f'{symbol}_model_info.joblib')
        )
        
        self.logger.info(f"Completed model training for {symbol}")
        return model_info

    def predict_with_uncertainty(
        self,
        symbol: str,
        current_data: pd.DataFrame,
        market_data: Optional[pd.DataFrame] = None,
        n_iterations: int = 100
    ) -> Dict[str, Union[float, Dict[str, float]]]:
        """
        Make predictions with uncertainty estimation using
        Monte Carlo dropout and ensemble techniques.
        
        Args:
            symbol: Trading symbol
            current_data: Recent market data
            market_data: Optional market context
            n_iterations: Number of Monte Carlo iterations
            
        Returns:
            Dictionary with predictions and uncertainty metrics
        """
        model_path = os.path.join(self.model_path, f'{symbol}_best.h5')
        info_path = os.path.join(self.model_path, f'{symbol}_model_info.joblib')
        
        if not all(os.path.exists(p) for p in [model_path, info_path]):
            raise ValueError(f"Model files not found for {symbol}")
        
        # Load model and info
        model = tf.keras.models.load_model(model_path)
        model_info = joblib.load(info_path)
        
        # Prepare features
        features = self.prepare_advanced_features(
            current_data,
            technical_indicators=True,
            market_data=market_data
        )
        
        # Prepare prediction data
        X = self._prepare_sequence_data(
            features,
            current_data['close'],
            model_info['sequence_length']
        )[0]
        
        # Monte Carlo predictions
        predictions = []
        for _ in range(n_iterations):
            pred = model(X, training=True)
            predictions.append(pred.numpy())
        
        predictions = np.array(predictions)
        
        # Calculate prediction metrics
        mean_pred = np.mean(predictions)
        std_pred = np.std(predictions)
        conf_interval = np.percentile(predictions, [2.5, 97.5])
        
        # Transform predictions back to price scale
        current_price = current_data['close'].iloc[-1]
        predicted_price = self.price_scaler.inverse_transform(
            mean_pred.reshape(-1, 1)
        )[0][0]
        
        price_change = (predicted_price - current_price) / current_price * 100
        
        # Calculate additional metrics
        prediction_metrics = {
            'current_price': current_price,
            'predicted_price': predicted_price,
            'predicted_change_percent': price_change,
            'confidence_interval': {
                'lower': conf_interval[0],
                'upper': conf_interval[1]
            },
            'uncertainty': std_pred / mean_pred,  # Coefficient of variation
            'prediction_std': std_pred
        }
        
        return prediction_metrics

    def _prepare_sequence_data(
        self,
        features: pd.DataFrame,
        target: pd.Series,
        sequence_length: int
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare sequential data with proper scaling."""
        # Scale features and target
        scaled_features = self.feature_scaler.fit_transform(features)
        scaled_target = self.price_scaler.fit_transform(
            target.values.reshape(-1, 1)
        )
        
        X, y = [], []
        for i in range(sequence_length, len(scaled_features)):
            X.append(scaled_features[i-sequence_length:i])
            y.append(scaled_target[i])
            
        return np.array(X), np.array(y)

    def _calculate_rolling_correlation(
        self,
        series1: pd.Series,
        series2: pd.Series,
        window: int = 20
    ) -> pd.Series:
        """Calculate rolling correlation between two series."""
        return series1.rolling(window).corr(series2)

    def _calculate_vwap(self, data: pd.DataFrame) -> pd.Series:
        """Calculate Volume Weighted Average Price."""
        typical_price = (data['high'] + data['low'] + data['close']) / 3
        return (typical_price * data['volume']).cumsum() / data['volume'].cumsum()

    def _calculate_obv(self, data: pd.DataFrame) -> pd.Series:
        """Calculate On-Balance Volume."""
        return (np.sign(data['close'].diff()) * data['volume']).cumsum()

    def _calculate_atr(
        self,
        data: pd.DataFrame,
        window: int = 14
    ) -> pd.Series:
        """Calculate Average True Range."""
        high_low = data['high'] - data['low']
        high_close = np.abs(data['high'] - data['close'].shift())
        low_close = np.abs(data['low'] - data['close'].shift())
        ranges = pd.concat([high_low, high_close, low_close], axis=1)
        true_range = ranges.max(axis=1)
        return true_range.rolling(window).mean()

    def _calculate_bollinger_bands(
        self,
        prices: pd.Series,
        window: int = 20,
        num_std: float = 2
    ) -> Tuple[pd.Series, pd.Series]:
        """Calculate Bollinger Bands."""
        rolling_mean = prices.rolling(window).mean()
        rolling_std = prices.rolling(window).std()
        upper_band = rolling_mean + (rolling_std * num_std)
        lower_band = rolling_mean - (rolling_std * num_std)
        return upper_band, lower_band

    def _calculate_rsi(
        self,
        prices: pd.Series,
        window: int = 14
    ) -> pd.Series:
        """Calculate RSI with proper handling of edge cases."""
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
        """Calculate MACD with proper handling of edge cases."""
        exp1 = prices.ewm(span=fast, adjust=False).mean()
        exp2 = prices.ewm(span=slow, adjust=False).mean()
        macd = exp1 - exp2
        signal_line = macd.ewm(span=signal, adjust=False).mean()
        
        return pd.DataFrame({
            'macd': macd,
            'signal': signal_line,
            'histogram': macd - signal_line
        })