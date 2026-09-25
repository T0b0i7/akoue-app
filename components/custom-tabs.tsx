import { BlurView } from "expo-blur";
import * as Icons from "phosphor-react-native";
import {
	Platform,
	StyleSheet,
	Text, // Import Text for the labels
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";
import { scale, verticalScale } from "@/utils/styling";

export default function CustomTabs({ state, descriptors, navigation }: any) {
	const insets = useSafeAreaInsets();
	const tabbarIcons: any = {
		index: (isFocused: boolean) => (
			<Icons.House
				size={28} // Slightly smaller size to accommodate label
				weight={isFocused ? "fill" : "regular"}
				color={isFocused ? colors.neutral100 : colors.neutral400}
			/>
		),
		statistics: (isFocused: boolean) => (
			<Icons.ChartBar
				size={28}
				weight={isFocused ? "fill" : "regular"}
				color={isFocused ? colors.neutral100 : colors.neutral400}
			/>
		),
		wallet: (isFocused: boolean) => (
			<Icons.Wallet
				size={28}
				weight={isFocused ? "fill" : "regular"}
				color={isFocused ? colors.neutral100 : colors.neutral400}
			/>
		),
		more: (isFocused: boolean) => (
			<Icons.SquaresFour
				size={28}
				weight={isFocused ? "fill" : "regular"}
				color={isFocused ? colors.neutral100 : colors.neutral400}
			/>
		),
	};

	return (
		<View style={[styles.tabBarShadow, { bottom: insets.bottom || 0 }]}>
			<View style={styles.tabBarContainer}>
				{/* --- THIS IS THE FIX ---
          We check the Platform.OS.
          - On 'ios', we render the BlurView as before.
          - On 'android', we render a regular View with a semi-transparent
            background, which avoids the native ViewManager error.
        */}
				{Platform.OS === "web" ? (
					<View style={styles.androidFallback} />
				) : (
					<BlurView style={styles.blurView} intensity={30} tint="dark" />
				)}

				{state.routes.map((route: any, index: any): any => {
					const { options } = descriptors[route.key];
					const label =
						options.tabBarLabel !== undefined
							? options.tabBarLabel
							: options.title !== undefined
								? options.title
								: route.name;

					const isFocused = state.index === index;

					const onPress = () => {
						const event = navigation.emit({
							type: "tabPress",
							target: route.key,
							canPreventDefault: true,
						});

						if (!isFocused && !event.defaultPrevented) {
							navigation.navigate(route.name, route.params);
						}
					};

					const onLongPress = () => {
						navigation.emit({
							type: "tabLongPress",
							target: route.key,
						});
					};

					const textColor = isFocused ? colors.neutral100 : colors.neutral400;

					return (
						<TouchableOpacity
							key={route.name}
							accessibilityState={isFocused ? { selected: true } : {}}
							accessibilityLabel={options.tabBarAccessibilityLabel}
							testID={options.tabBarButtonTestID}
							onPress={onPress}
							onLongPress={onLongPress}
							style={styles.tabBarItem}
						>
							{tabbarIcons[route.name] && tabbarIcons[route.name](isFocused)}
							{/* Re-enabled labels for a standard iOS feel */}
							<Text style={[styles.labelText, { color: textColor }]}>
								{label}
							</Text>
						</TouchableOpacity>
					);
				})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	tabBarShadow: {
		position: "absolute",
		bottom: 0,
		left: scale(12),
		right: scale(12),
		height: verticalScale(72),
		paddingBottom: Platform.OS === "ios" ? verticalScale(10) : 0,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 5,
		},
		shadowOpacity: 0.1,
		shadowRadius: 15,
		elevation: 10,
	},
	tabBarContainer: {
		flexDirection: "row",
		height: "100%",
		justifyContent: "space-around",
		alignItems: "center",
		borderRadius: 37.5,
		overflow: "hidden",
	},
	blurView: {
		...StyleSheet.absoluteFillObject,
		zIndex: -1,
	},
	androidFallback: {
		...StyleSheet.absoluteFillObject,
		zIndex: -1,
		backgroundColor: "rgba(30, 30, 30, 0.85)",
	},
	tabBarItem: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: verticalScale(10),
	},
	labelText: {
		fontSize: scale(10),
		fontWeight: "500",
		marginTop: verticalScale(4),
		letterSpacing: 0.5,
	},
});
