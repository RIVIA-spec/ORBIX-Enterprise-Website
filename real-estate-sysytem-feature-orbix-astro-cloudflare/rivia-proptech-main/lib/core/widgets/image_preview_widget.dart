// lib/core/widgets/image_preview_widget.dart
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

class ImagePreviewWidget extends StatelessWidget {
  final String? imageUrl;  // ← الآن nullable
  final double? height;
  final double? width;
  final BoxFit? fit;

  const ImagePreviewWidget({
    super.key,
    this.imageUrl,        // ← لم يعد required
    this.height,
    this.width,
    this.fit,
  });

  @override
  Widget build(BuildContext context) {
    // إذا كان imageUrl null أو فارغ
    if (imageUrl == null || imageUrl!.trim().isEmpty) {
      return _buildPlaceholder();
    }

    final double effectiveWidth = width ?? double.infinity;
    final double effectiveHeight = height ?? 120;

    return GestureDetector(
      onTap: () => _showFullImage(context, imageUrl!),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: SizedBox(
          width: effectiveWidth,
          height: effectiveHeight,
          child: CachedNetworkImage(
            imageUrl: imageUrl!,
            fit: fit ?? BoxFit.cover,
            placeholder: (_, __) => _buildLoading(),
            errorWidget: (_, __, ___) => _buildError(),
          ),
        ),
      ),
    );
  }

  // مكان فارغ
  Widget _buildPlaceholder() {
    return Container(
      height: height ?? 120,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.hide_image, size: 32, color: Colors.grey[600]),
            const SizedBox(height: 4),
            Text(
              "لا توجد صورة",
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  // تحميل
  Widget _buildLoading() {
    return Container(
      color: Colors.grey[200],
      child: const Center(
        child: SizedBox(
          width: 20,
          height: 20,
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      ),
    );
  }

  // خطأ
  Widget _buildError() {
    return Container(
      color: Colors.red[50],
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, color: Colors.red[700], size: 28),
            const SizedBox(height: 4),
            Text(
              "فشل التحميل",
              style: TextStyle(fontSize: 11, color: Colors.red[700]),
            ),
          ],
        ),
      ),
    );
  }

  // تكبير الصورة
  void _showFullImage(BuildContext context, String url) {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: Colors.black87,
        child: Stack(
          children: [
            Center(
              child: InteractiveViewer(
                child: CachedNetworkImage(
                  imageUrl: url,
                  fit: BoxFit.contain,
                  placeholder: (_, __) => const Center(
                    child: CircularProgressIndicator(color: Colors.white),
                  ),
                  errorWidget: (_, __, ___) => const Icon(
                    Icons.error_outline,
                    color: Colors.white,
                    size: 48,
                  ),
                ),
              ),
            ),
            Positioned(
              top: 40,
              right: 16,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 30),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ],
        ),
      ),
    );
  }
}