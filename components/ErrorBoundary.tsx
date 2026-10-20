import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import Typo from "@/components/typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import ButtonComponent from "@/components/button";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(_error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", _error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <View style={styles.container}>
          <Typo size={20} fontWeight={"600"} color={colors.white}>
            Une erreur est survenue
          </Typo>
          <Typo size={14} color={colors.neutral400} style={{ marginTop: spacingY._10, textAlign: "center" }}>
            Une partie de l’application ne fonctionne pas correctement.
          </Typo>
          <ButtonComponent
            onPress={() => this.setState({ hasError: false })}
            style={styles.retryButton}
          >
            <Typo color={colors.white} fontWeight={"600"}>
              Réessayer
            </Typo>
          </ButtonComponent>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacingX._20,
  },
  retryButton: {
    marginTop: spacingY._20,
    backgroundColor: colors.primary,
  },
});

export default ErrorBoundary;
