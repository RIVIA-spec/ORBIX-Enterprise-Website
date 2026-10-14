import 'package:flutter/material.dart';

class FadeInWidget extends StatefulWidget {
  final Widget child;
  final Duration duration;
  final Curve curve;
  final Duration delay;

  const FadeInWidget({
    super.key,
    required this.child,
    this.duration = const Duration(milliseconds: 700),
    this.curve = Curves.easeInOut,
    this.delay = Duration.zero,
  });

  @override
  State<FadeInWidget> createState() => _FadeInWidgetState();
}

class _FadeInWidgetState extends State<FadeInWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _opacity;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: widget.duration,
    );

    _opacity = CurvedAnimation(
      parent: _controller,
      curve: widget.curve,
    );

    Future.delayed(widget.delay, () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _opacity,
      child: widget.child,
    );
  }
}



/// 🔹 انيميشن انزلاق من الأسفل مع تلاشي
Widget slideFromBottomAnimation({
  required Widget child,
  required int index,
  Duration duration = const Duration(milliseconds: 400),
  double offsetY = 50.0,
}) {
  final delay = Duration(milliseconds: 100 * index);
  return TweenAnimationBuilder(
    tween: Tween<Offset>(begin: Offset(0, offsetY), end: Offset.zero),
    duration: duration,
    curve: Curves.easeOut,
    builder: (context, Offset value, childWidget) {
      return Transform.translate(
        offset: value,
        child: AnimatedOpacity(
          opacity: value == Offset.zero ? 1 : 0,
          duration: duration,
          child: childWidget,
        ),
      );
    },
    child: child,
  );
}

/// 🔹 Fade + Scale (مع تأخير staggered)
Widget fadeScaleStaggered({
  required Widget child,
  required int index,
  Duration duration = const Duration(milliseconds: 400),
}) {
  final delay = Duration(milliseconds: 100 * index);
  return TweenAnimationBuilder(
    tween: Tween<double>(begin: 0.8, end: 1.0),
    duration: duration,
    curve: Curves.easeOutBack,
    builder: (context, scale, childWidget) {
      return Transform.scale(
        scale: scale,
        child: AnimatedOpacity(
          opacity: scale == 1.0 ? 1 : 0,
          duration: duration,
          child: childWidget,
        ),
      );
    },
    child: child,
  );
}