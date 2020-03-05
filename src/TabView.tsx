import * as React from 'react';
import {
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
} from 'react-native';
import {
  PanGestureHandler,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import TabBar, { Props as TabBarProps } from './TabBar';
import SceneView from './SceneView';
import {
  Layout,
  NavigationState,
  Route,
  SceneRendererProps,
  PagerCommonProps,
} from './types';
import Pager, { Props as ChildProps } from './Pager';

export type Props<T extends Route> = PagerCommonProps & {
  position?: Animated.Value<number>;
  onIndexChange: (index: number) => void;
  navigationState: NavigationState<T>;
  renderScene: (
    props: SceneRendererProps & {
      route: T;
    }
  ) => React.ReactNode;
  renderLazyPlaceholder: (props: { route: T }) => React.ReactNode;
  renderTabBar: (
    props: SceneRendererProps & {
      navigationState: NavigationState<T>;
    }
  ) => React.ReactNode;
  tabBarPosition: 'top' | 'bottom';
  initialLayout?: { width?: number; height?: number };
  lazy: boolean;
  lazyPreloadDistance: number;
  removeClippedSubviews?: boolean;
  sceneContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  gestureHandlerProps: React.ComponentProps<typeof PanGestureHandler>;
  renderPager: (props: ChildProps<T>) => React.ReactNode;
};

type State = {
  layout: Layout;
  focusedSceneHeightByRouteKey: { [key: string]: number | undefined };
};

const GestureHandlerWrapper = GestureHandlerRootView ?? View;

export default class TabView<T extends Route> extends React.Component<
  Props<T>,
  State
> {
  static defaultProps = {
    tabBarPosition: 'top',
    renderTabBar: <P extends Route>(props: TabBarProps<P>) => (
      <TabBar {...props} />
    ),
    renderLazyPlaceholder: () => null,
    keyboardDismissMode: 'auto',
    swipeEnabled: true,
    lazy: false,
    lazyPreloadDistance: 0,
    removeClippedSubviews: false,
    springConfig: {},
    timingConfig: {},
    gestureHandlerProps: {},
    renderPager: (props: ChildProps<any>) => <Pager {...props} />,
  };

  state: State = {
    layout: { width: 0, height: 0, ...this.props.initialLayout },
    focusedSceneHeightByRouteKey: {},
  };

  private jumpToIndex = (index: number) => {
    if (index !== this.props.navigationState.index) {
      this.props.onIndexChange(index);
    }
  };

  private handleLayout = (e: LayoutChangeEvent) => {
    const { height, width } = e.nativeEvent.layout;

    if (
      this.state.layout.width === width &&
      this.state.layout.height === height
    ) {
      return;
    }

    this.setState({
      layout: {
        height,
        width,
      },
    });
  };

  handleFocusedSceneLayout = (event: LayoutChangeEvent, routeKey: string) => {
    const height = event.nativeEvent.layout.height;
    this.setState((prevState: State) => ({
      focusedSceneHeightByRouteKey: {
        ...prevState.focusedSceneHeightByRouteKey,
        [routeKey]: height,
      },
    }));
  };

  render() {
    const {
      position: positionListener,
      onSwipeStart,
      onSwipeEnd,
      navigationState,
      lazy,
      lazyPreloadDistance,
      removeClippedSubviews,
      keyboardDismissMode,
      swipeEnabled,
      swipeVelocityImpact,
      timingConfig,
      springConfig,
      tabBarPosition,
      renderTabBar,
      renderScene,
      renderLazyPlaceholder,
      sceneContainerStyle,
      style,
      gestureHandlerProps,
      springVelocityScale,
      renderPager,
    } = this.props;
    const { layout } = this.state;

    return (
      <GestureHandlerWrapper
        onLayout={this.handleLayout}
        style={[styles.pager, style]}
      >
        {renderPager({
          navigationState,
          layout,
          keyboardDismissMode,
          swipeEnabled,
          swipeVelocityImpact,
          timingConfig,
          springConfig,
          onSwipeStart,
          onSwipeEnd,
          onIndexChange: this.jumpToIndex,
          springVelocityScale,
          removeClippedSubviews,
          gestureHandlerProps,
          children: ({
            position,
            render,
            addListener,
            removeListener,
            jumpTo,
          }) => {
            // All of the props here must not change between re-renders
            // This is crucial to optimizing the routes with PureComponent
            const sceneRendererProps = {
              position,
              layout,
              jumpTo,
            };

            const focusedSceneHeight = this.state.focusedSceneHeightByRouteKey[
              navigationState.routes[navigationState.index].key
            ];

            return (
              <React.Fragment>
                {positionListener ? (
                  <Animated.Code
                    exec={Animated.set(positionListener, position)}
                  />
                ) : null}
                {tabBarPosition === 'top' &&
                  renderTabBar({
                    ...sceneRendererProps,
                    navigationState,
                  })}
                {render(
                  navigationState.routes.map((route, i) => {
                    const focused = navigationState.index === i;
                    const unfocusedSceneStyle =
                      !focused && focusedSceneHeight
                        ? {
                            // Give unfocused scene a maximum height equal to focused scene's height.
                            // This prevents unfocused scene from causing extra / empty space to appear
                            // beneath focused scene, in the case where the unfocused scene's height would
                            // otherwise be greater than the focused scene's height.
                            maxHeight: focusedSceneHeight,
                          }
                        : undefined;

                    return (
                      <SceneView
                        {...sceneRendererProps}
                        addListener={addListener}
                        removeListener={removeListener}
                        key={route.key}
                        routeKey={route.key}
                        handleLayout={
                          focused ? this.handleFocusedSceneLayout : undefined
                        }
                        index={i}
                        lazy={lazy}
                        lazyPreloadDistance={lazyPreloadDistance}
                        navigationState={navigationState}
                        style={[unfocusedSceneStyle, sceneContainerStyle]}
                      >
                        {({ loading }) =>
                          loading
                            ? renderLazyPlaceholder({ route })
                            : renderScene({
                                ...sceneRendererProps,
                                route,
                              })
                        }
                      </SceneView>
                    );
                  })
                )}
                {tabBarPosition === 'bottom' &&
                  renderTabBar({
                    ...sceneRendererProps,
                    navigationState,
                  })}
              </React.Fragment>
            );
          },
        })}
      </GestureHandlerWrapper>
    );
  }
}

const styles = StyleSheet.create({
  pager: {
    flex: 1,
    overflow: 'hidden',
  },
});
