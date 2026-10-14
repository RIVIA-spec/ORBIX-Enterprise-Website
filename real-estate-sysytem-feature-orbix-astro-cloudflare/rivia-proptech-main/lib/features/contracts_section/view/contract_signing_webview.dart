import 'package:flutter/material.dart';
import 'package:real_estate_app/core/widgets/custom_app_bar.dart';
import 'package:webview_flutter/webview_flutter.dart';

class ContractSigningWebView extends StatefulWidget {
  final String signingUrl;

  const ContractSigningWebView({
    super.key,
    required this.signingUrl,
  });

  @override
  State<ContractSigningWebView> createState() => _ContractSigningWebViewState();
}

class _ContractSigningWebViewState extends State<ContractSigningWebView> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) {
            if (mounted) setState(() => _isLoading = false);
          },
          onWebResourceError: (_) {
            if (mounted) setState(() => _isLoading = false);
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.signingUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(title: 'توقيع العقد'),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}
