import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:loading_animation_widget/loading_animation_widget.dart';

class LoadingProgressiveDots extends StatelessWidget {
  const LoadingProgressiveDots({super.key, this.color, this.size});

  final Color? color; 
  final double? size;

  @override
  Widget build(BuildContext context) {
    return LoadingAnimationWidget.progressiveDots(
      color: color?? Colors.white, size: size ?? 20
    );
  }
}

class LoadingThreeArchedCircle extends StatelessWidget {
  const LoadingThreeArchedCircle({super.key, this.color, this.size});

  final Color? color; 
  final double? size;

  @override
  Widget build(BuildContext context) {
    return LoadingAnimationWidget.threeArchedCircle(
      color: color?? Colors.white, size: size ?? 20
    );
  }
}

class LoadingDiscreteCircular extends StatelessWidget {
  const LoadingDiscreteCircular({super.key, this.color, this.size, this.margin});

  final Color? color; 
  final double? size;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    return Container(
      alignment: Alignment.center,
      margin: margin,
      child: LoadingAnimationWidget.discreteCircle(
        color: color?? Colors.blue, size: size ?? 50,
        secondRingColor: Colors.blue.withOpacity(0.7),
        thirdRingColor: Colors.blue.withOpacity(0.3)
      ),
    );
  }
}