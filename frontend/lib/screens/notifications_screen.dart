import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  Future<void> _fetchNotifications() async {
    try {
      final response = await ApiService().dio.get('/notifications');
      if (mounted) {
        setState(() {
          _notifications = response.data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
      print(e);
    }
  }

  Future<void> _markAsRead(String id) async {
    try {
      await ApiService().dio.put('/notifications/$id/read');
      // Optimistically update UI
      setState(() {
        final index = _notifications.indexWhere((n) => n['_id'] == id);
        if (index != -1) {
          _notifications[index]['read'] = true;
        }
      });
    } catch (e) {
      print(e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      backgroundColor: Colors.grey[50], 
      appBar: AppBar(
        title: Text("Notifications", style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: Colors.black)),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _notifications.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.notifications_none, size: 60, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  Text("No notifications yet", style: GoogleFonts.poppins(color: Colors.grey[500])),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _fetchNotifications,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _notifications.length,
                itemBuilder: (context, index) {
                  final notif = _notifications[index];
                  final isRead = notif['read'] ?? false;
                  
                  return GestureDetector(
                    onTap: () {
                      if (!isRead) _markAsRead(notif['_id']);
                    },
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: isRead ? Colors.white : Colors.blue.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: isRead ? Colors.transparent : Colors.blue.withOpacity(0.1)),
                        boxShadow: isRead ? [BoxShadow(color: Colors.grey.withOpacity(0.05), blurRadius: 5)] : [],
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(16),
                        leading: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary.withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(Icons.notifications, color: theme.colorScheme.primary),
                        ),
                        title: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(child: Text(notif['title'] ?? "Notification", style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 14))),
                            if (notif['createdAt'] != null)
                            Text(notif['createdAt'].toString().substring(0, 10), style: GoogleFonts.inter(color: Colors.grey, fontSize: 10)),
                          ],
                        ),
                        subtitle: Padding(
                          padding: const EdgeInsets.only(top: 6.0),
                          child: Text(notif['message'] ?? "", style: GoogleFonts.inter(color: Colors.black87, fontSize: 13, height: 1.4)),
                        ),
                        trailing: !isRead ? Container(width: 8, height: 8, decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle)) : null,
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
