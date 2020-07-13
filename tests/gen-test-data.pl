#!/usr/bin/perl

my $now = time();
my $start = $now - 7 * 24 * 60 * 60; # 7 days ago

for (my $t = $start; $t < $now; $t += 3)
{
	my($sec,$min,$hour,$mday,$mon,$year) = localtime($t);
	$year += 1900;
	print "$t\t$min\t$min\n";
}
