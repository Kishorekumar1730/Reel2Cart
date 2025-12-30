import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Robust Tablet Detection
// Checks if the smallest dimension is at least 600px (standard Android/iOS tablet definition)
const isTabletDevice = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) >= 600;

// Base width for scaling
// 375 is standard iPhone width. 768 is standard iPad width.
const baseWidth = isTabletDevice ? 768 : 375;

const scale = SCREEN_WIDTH / baseWidth;

/**
 * Normalizes font size and element size based on screen width.
 * Prevents elements from becoming too large on tablets.
 */
export function normalize(size) {
    const newSize = size * scale;
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize));
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
    }
}

/**
 * Width Percentage
 */
export const wp = (percentage) => {
    const value = (percentage * SCREEN_WIDTH) / 100;
    return Math.round(value);
};

/**
 * Height Percentage
 */
export const hp = (percentage) => {
    const value = (percentage * SCREEN_HEIGHT) / 100;
    return Math.round(value);
};

export const isTablet = () => isTabletDevice;

export const SCREEN_DIMENSIONS = {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT
};
