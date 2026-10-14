// =============================================
// FILE: panorama_editor_page.dart
// =============================================
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:panorama_viewer/panorama_viewer.dart';
// import 'package:panorama/panorama.dart';

class HotspotData {
  final int sourceIndex;
  final int targetIndex;
  final double longitude;
  final double latitude;
  final String? label;

  HotspotData({
    required this.sourceIndex,
    required this.targetIndex,
    required this.longitude,
    required this.latitude,
    this.label,
  });

  Map<String, dynamic> toJson() => {
        'sourceIndex': sourceIndex,
        'targetIndex': targetIndex,
        'longitude': longitude,
        'latitude': latitude,
        'label': label,
      };
}


class PanoramaHotspotEditor extends StatefulWidget {
  final File imageFile;
  final int index;
  final int total;

  const PanoramaHotspotEditor({
    Key? key,
    required this.imageFile,
    required this.index,
    required this.total,
  }) : super(key: key);

  @override
  _PanoramaHotspotEditorState createState() => _PanoramaHotspotEditorState();
}

class _PanoramaHotspotEditorState extends State<PanoramaHotspotEditor> {
  double? _tapLon;
  double? _tapLat;
  double lon = 0.0;
  double lat = 0.0;

  @override
  Widget build(BuildContext context) {
    final isFirst = widget.index == 0;
    final isLast = widget.index == widget.total - 1;

    return Scaffold(
      appBar: AppBar(title: Text('تحرير الصورة ${widget.index + 1}')),
      body: Stack(
        children: [
          PanoramaViewer(
            animSpeed: 2,
            sensorControl: SensorControl.none,
            child: Image.file(widget.imageFile),
            onTap: (lonTap, latTap, tilt) {
              setState(() {
                _tapLon = lonTap;
                _tapLat = latTap;
              });
            },
            onViewChanged: (lonNew, latNew, tilt) {
              lon = lonNew;
              lat = latNew;
            },
            hotspots: _tapLon != null
                ? [
                    Hotspot(
                      latitude: _tapLat!,
                      longitude: _tapLon!,
                      width: 60,
                      height: 60,
                      widget: Icon(Icons.place, size: 40, color: Colors.red),
                    )
                  ]
                : [],
          ),

          Positioned(
            bottom: 20,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (!isFirst)
                  ElevatedButton(
                    child: Text('زر السابق'),
                    onPressed: () {
                      Navigator.pop(
                        context,
                        HotspotData(
                          sourceIndex: widget.index,
                          targetIndex: widget.index - 1,
                          longitude: _tapLon ?? lon,
                          latitude: _tapLat ?? lat,
                        ),
                      );
                    },
                  ),
                SizedBox(width: 10),
                if (!isLast)
                  ElevatedButton(
                    child: Text('زر التالي'),
                    onPressed: () {
                      Navigator.pop(
                        context,
                        HotspotData(
                          sourceIndex: widget.index,
                          targetIndex: widget.index + 1,
                          longitude: _tapLon ?? lon,
                          latitude: _tapLat ?? lat,
                        ),
                      );
                    },
                  ),
              ],
            ),
          )
        ],
      ),
    );
  }
}
