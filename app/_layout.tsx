import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { colors } from "@/constants/theme";
import { AuthProvider } from "@/context/auth-context";
import { LocaleProvider } from "@/context/locale-context";

import "./global.css";

export default function RootLayout() {
	return (
		<AuthProvider>
			<LocaleProvider>
				<View style={styles.appBackground}>
				<Stack
					screenOptions={{
						headerShown: false,
						// animation: "slide_from_bottom",
						// animationDuration: 100,
					}}
				>
					<Stack.Screen
						name="(modals)/update-profile-modal"
						options={{
							presentation: "modal",
						}}
					/>
					<Stack.Screen
						name="(modals)/change-password-modal"
						options={{
							presentation: "modal",
						}}
					/>
					<Stack.Screen
						name="(modals)/setting-modal"
						options={{
							presentation: "modal",
						}}
					/>

					<Stack.Screen
						name="(modals)/search-modal"
						options={{
							presentation: "modal",
						}}
					/>

					<Stack.Screen
						name="(modals)/transaction-modal"
						options={{
							presentation: "modal",
						}}
					/>

					<Stack.Screen
						name="(modals)/wallet-modal"
						options={{
							presentation: "modal",
						}}
					/>

					<Stack.Screen
						name="(modals)/profile-modal"
						options={{
							presentation: "modal",
						}}
					/>
					<Stack.Screen
						name="(modals)/exchange-rate-modal"
						options={{
							presentation: "modal",
						}}
					/>
				</Stack>
				</View>
			</LocaleProvider>
		</AuthProvider>
	);
}

const styles = StyleSheet.create({
	appBackground: {
		flex: 1,
		backgroundColor: colors.neutral900,
	},
});
